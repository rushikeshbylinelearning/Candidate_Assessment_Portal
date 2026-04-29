/**
 * rmsWebhookReceiver.js
 * Receives real-time candidate pushes from HR Workflow Management (RMS).
 *
 * Mounted in server.js as:
 *   app.use('/api/rms-webhook', rmsWebhookRoutes);
 *
 * So the full endpoint is:
 *   POST /api/rms-webhook/candidate
 */

const router = require('express').Router();
const Candidate = require('../candidate/candidate.model');
const Role = require('../roles/role.model');
const { generateAccessCode } = require('../../utils/generateToken');
const { log } = require('../../utils/logger');

// ─── Webhook secret auth ──────────────────────────────────────────────────────
const verifyWebhookSecret = (req, res, next) => {
  const secret = req.headers['x-webhook-secret'];
  if (!secret) {
    return res.status(401).json({ success: false, message: 'x-webhook-secret header missing' });
  }
  if (!process.env.ASSESSMENT_PORTAL_WEBHOOK_SECRET) {
    console.error('[RmsWebhookReceiver] ASSESSMENT_PORTAL_WEBHOOK_SECRET not set in .env');
    return res.status(500).json({ success: false, message: 'Webhook secret not configured on server' });
  }
  if (secret !== process.env.ASSESSMENT_PORTAL_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid webhook secret' });
  }
  next();
};

// ─── Experience years → CAP enum ─────────────────────────────────────────────
function mapExperienceLevel(experienceStr) {
  const years = parseFloat(experienceStr) || 0;
  if (years >= 8)  return 'lead';
  if (years >= 5)  return 'senior';
  if (years >= 3)  return 'mid';
  if (years >= 1)  return 'junior';
  return 'intern';
}

// ─── Generate unique access code ─────────────────────────────────────────────
async function getUniqueAccessCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateAccessCode();
    const existing = await Candidate.findOne({ accessCode: code });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique access code after 10 attempts');
}

// ─── POST /api/rms-webhook/candidate ─────────────────────────────────────────
router.post('/candidate', verifyWebhookSecret, async (req, res) => {
  try {
    const { event, candidate: rmsC } = req.body;

    console.log('[RmsWebhookReceiver] Received event:', event);

    // Only handle candidate.created — ignore everything else
    if (event !== 'candidate.created') {
      return res.json({ success: true, message: 'Event ignored' });
    }

    // Validate required fields
    if (!rmsC || !rmsC.email) {
      return res.status(400).json({ success: false, message: 'candidate.email is required' });
    }
    if (!rmsC.name) {
      return res.status(400).json({ success: false, message: 'candidate.name is required' });
    }

    const emailLower = rmsC.email.toLowerCase().trim();

    // Skip if already exists — idempotent
    const existing = await Candidate.findOne({ email: emailLower });
    if (existing) {
      console.log('[RmsWebhookReceiver] Candidate already exists, skipping:', emailLower);
      return res.json({ success: true, message: 'Candidate already exists', skipped: true });
    }

    // ── Role resolution ──────────────────────────────────────────────────────
    // RMS sends a position string (e.g. "React Developer").
    // CAP stores Roles as documents with a `title` field.
    // We match case-insensitively.
    const positionStr = (rmsC.position || '').trim();
    let appliedRole = null;

    if (positionStr) {
      // Try exact match first (case-insensitive)
      appliedRole = await Role.findOne({
        title: { $regex: new RegExp(`^${positionStr}$`, 'i') },
        active: true,
      });

      // If no exact match, try partial match (contains)
      if (!appliedRole) {
        appliedRole = await Role.findOne({
          title: { $regex: new RegExp(positionStr, 'i') },
          active: true,
        });
      }
    }

    // If still no match, fall back to first active role
    // This prevents hard failures when position name doesn't match exactly
    if (!appliedRole) {
      console.warn(
        `[RmsWebhookReceiver] No role found for position: "${positionStr}". ` +
        `Falling back to first active role.`
      );
      appliedRole = await Role.findOne({ active: true }).sort('createdAt');
    }

    if (!appliedRole) {
      return res.status(422).json({
        success: false,
        message: `No roles exist in CAP yet. Create at least one Role in the Admin panel first.`,
      });
    }

    // ── Create candidate ─────────────────────────────────────────────────────
    const accessCode = await getUniqueAccessCode();

    const candidate = new Candidate({
      name:             rmsC.name.trim(),
      email:            emailLower,
      phone:            rmsC.phone  || '',
      appliedRole:      appliedRole._id,
      experienceLevel:  mapExperienceLevel(rmsC.experience),
      accessCode,
      assessmentStatus: 'pending',
      interviewStatus:  'not_scheduled',
    });

    // Timeline entry (no performedBy since this is a system action)
    candidate.timeline.push({
      event:       'created',
      description: `Auto-imported from RMS via webhook — stage: ${rmsC.stage || 'Applied'}, source: ${rmsC.source || 'Public Form'}`,
    });

    await candidate.save();

    // Activity log (no userId since this is server-to-server)
    await log({
      action:   'WEBHOOK_IMPORT_FROM_RMS',
      entity:   'candidate',
      entityId: candidate._id,
      details:  { rmsId: rmsC.id, position: positionStr, stage: rmsC.stage },
    });

    console.log('[RmsWebhookReceiver] ✅ Created candidate:', emailLower, '| Role:', appliedRole.title, '| Code:', accessCode);

    return res.status(201).json({
      success:     true,
      candidateId: candidate._id,
      accessCode,
      roleMapped:  appliedRole.title,
    });

  } catch (err) {
    console.error('[RmsWebhookReceiver] Error:', err.message);
    console.error(err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;