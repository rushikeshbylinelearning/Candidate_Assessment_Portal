const cacheService = require('../services/cache.service');

/** Paths that must always hit the database (live status, auth, webhooks). */
const SKIP_PATH_PATTERNS = [
  /\/status$/i,
  /\/api\/auth\//i,
  /\/api\/tokens\//i,
  /\/api\/pipeline\/session/i,
  /\/api\/rms-webhook/i,
  /\/api\/health/i,
];

function shouldSkipCache(req) {
  if (req.method !== 'GET') return true;
  if (req.query.nocache === '1' || req.get('Cache-Control')?.includes('no-cache')) return true;
  const path = req.originalUrl || req.url;
  return SKIP_PATH_PATTERNS.some((re) => re.test(path));
}

function userScope(req) {
  return req.user?._id ? String(req.user._id) : 'anon';
}

/**
 * Cache GET JSON responses per user + URL.
 * @param {string} namespace - e.g. 'analytics', 'candidates'
 */
function httpCache(namespace) {
  return (req, res, next) => {
    if (shouldSkipCache(req)) return next();

    const scope = userScope(req);
    const cacheUrl = req.originalUrl;
    const hit = cacheService.get(namespace, scope, 'GET', cacheUrl);

    if (hit !== null) {
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Namespace', namespace);
      return res.json(hit);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(namespace, scope, 'GET', cacheUrl, body);
      }
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Namespace', namespace);
      return originalJson(body);
    };

    next();
  };
}

module.exports = { httpCache, shouldSkipCache };
