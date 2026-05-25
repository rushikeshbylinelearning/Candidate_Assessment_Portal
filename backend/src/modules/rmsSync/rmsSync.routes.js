/**
 * rmsSync.routes.js
 * Manual pull: Admin/HR can preview and import candidates from RMS into CAP.
 *
 * Mounted in server.js as:
 *   app.use('/api/rms-sync', rmsSyncRoutes);
 */

const router = require('express').Router();
const { protect, authorize } = require('../../middleware/auth');
const Candidate = require('../candidate/candidate.model');
const Role = require('../roles/role.model');
const { generateAccessCode } = require('../../utils/generateToken');
const { log } = require('../../utils/logger');

// All routes require login + admin or hr role
router.use(protect);
router.use(authorize('admin', 'hr'));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchFromRms(endpoint, params = {}) {
  const base = process.env.RMS_API_BASE_URL;
  const key  = process.env.RMS_API_KEY;

  if (!base || !key) {
    throw new Error('RMS_API_BASE_URL and RMS_API_KEY must be set in CAP .env');
  }

  const url = new URL(`${base}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.append(k, v); });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'x-rms-api-key': key },
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `RMS returned ${res.status}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function mapExperienceLevel(experienceStr) {
  const years = parseFloat(experienceStr) || 0;
  if (years >= 8)  return 'lead';
  if (years >= 5)  return 'senior';
  if (years >= 3)  return 'mid';
  if (years >= 1)  return 'junior';
  return 'intern';
}

async function getUniqueAccessCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateAccessCode();
    const existing = await Candidate.findOne({ accessCode: code });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique access code after 10 attempts');
}

async function buildRoleMap() {
  const roles = await Role.find({ active: true }).select('title');
  const map = {};
  roles.forEach(r => { map[r.title.toLowerCase().trim()] = r._id; });
  return map;
}

// ─── GET /api/rms-sync/status ─────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  let rmsReachable = false;
  let rmsTotal = null;
  try {
    const data = await fetchFromRms('/rms-export/candidates', { limit: 1 });
    rmsReachable = true;
    rmsTotal = data.data?.total ?? null;
  } catch (e) {
    console.error('[RmsSync] Status check failed:', e.message);
  }

  const localTotal = await Candidate.countDocuments({});

  res.json({
    success: true,
    rmsReachable,
    rmsTotal,
    localTotal,
    rmsBaseUrl: process.env.RMS_API_BASE_URL || '(not configured)',
  });
});

// ─── GET /api/rms-sync/candidates ────────────────────────────────────────────
// Preview candidates from RMS — does NOT write to DB
router.get('/candidates', async (req, res) => {
  try {
    const { stage, search } = req.query;
    const data = await fetchFromRms('/rms-export/candidates', { stage, search });
    const rmsCandidates = data.data?.candidates || [];

    // Mark which ones already exist in CAP
    const emails = rmsCandidates.map(c => (c.email || '').toLowerCase());
    const existing = await Candidate.find({ email: { $in: emails } }).select('email');
    const existingEmails = new Set(existing.map(c => c.email));

    const preview = rmsCandidates.map(c => ({
      ...c,
      alreadyImported: existingEmails.has((c.email || '').toLowerCase()),
    }));

    res.json({
      success:    true,
      total:      preview.length,
      newCount:   preview.filter(c => !c.alreadyImported).length,
      candidates: preview,
    });
  } catch (err) {
    console.error('[RmsSync] fetchCandidates error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/rms-sync/import ───────────────────────────────────────────────
// Import candidates from RMS into CAP MongoDB
// Body (optional): { stage, search, candidateIds: ["uuid1", "uuid2"] }
router.post('/import', async (req, res) => {
  try {
    const { stage, search, candidateIds } = req.body || {};

    const data = await fetchFromRms('/rms-export/candidates', { stage, search });
    let rmsCandidates = data.data?.candidates || [];

    // Filter to specific IDs if provided
    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      const idSet = new Set(candidateIds.map(String));
      rmsCandidates = rmsCandidates.filter(c => idSet.has(String(c.id)));
    }

    if (rmsCandidates.length === 0) {
      return res.json({ success: true, imported: 0, skipped: 0, errors: [] });
    }

    // Pre-build role map
    const roleMap = await buildRoleMap();

    // Find already-imported emails
    const emails = rmsCandidates.map(c => (c.email || '').toLowerCase());
    const existing = await Candidate.find({ email: { $in: emails } }).select('email');
    const existingEmails = new Set(existing.map(c => c.email));

    let imported = 0;
    let skipped  = 0;
    const errors = [];

    for (const rmsC of rmsCandidates) {
      const emailLower = (rmsC.email || '').toLowerCase().trim();

      if (existingEmails.has(emailLower)) {
        skipped++;
        continue;
      }

      try {
        // Resolve role
        const positionKey = (rmsC.position || '').toLowerCase().trim();
        let roleId = roleMap[positionKey];

        // Partial match fallback
        if (!roleId) {
          const partialKey = Object.keys(roleMap).find(k =>
            k.includes(positionKey) || positionKey.includes(k)
          );
          if (partialKey) roleId = roleMap[partialKey];
        }

        // Last resort: first available role
        if (!roleId) {
          const firstRole = await Role.findOne({ active: true }).sort('createdAt');
          if (firstRole) {
            roleId = firstRole._id;
            console.warn(`[RmsSync] No role match for "${rmsC.position}", using: ${firstRole.title}`);
          }
        }

        if (!roleId) {
          errors.push({ email: emailLower, reason: 'No roles exist in CAP. Create one first.' });
          continue;
        }

        const accessCode = await getUniqueAccessCode();

        const candidate = new Candidate({
          name:             (rmsC.name || '').trim(),
          email:            emailLower,
          phone:            rmsC.phone || '',
          appliedRole:      roleId,
          experienceLevel:  mapExperienceLevel(rmsC.experience),
          accessCode,
          assessmentStatus: 'pending',
          interviewStatus:  'not_scheduled',
          addedBy:          req.user._id,
        });

        candidate.timeline.push({
          event:       'created',
          description: `Imported from RMS (stage: ${rmsC.stage || 'Applied'})`,
          performedBy: req.user._id,
        });

        await candidate.save();

        await log({
          userId:   req.user._id,
          action:   'IMPORT_FROM_RMS',
          entity:   'candidate',
          entityId: candidate._id,
          details:  { rmsId: rmsC.id, position: rmsC.position },
        });

        imported++;
        existingEmails.add(emailLower); // prevent double-insert in same batch
      } catch (err) {
        errors.push({ email: emailLower, reason: err.message });
      }
    }

    res.json({ success: true, imported, skipped, errors });
  } catch (err) {
    console.error('[RmsSync] import error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;