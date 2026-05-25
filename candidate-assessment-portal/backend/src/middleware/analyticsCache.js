/**
 * Short-lived in-memory cache for expensive analytics endpoints.
 * Reduces duplicate DB load when Dashboard + Analytics pages load the same data.
 */

const TTL_MS = parseInt(process.env.ANALYTICS_CACHE_TTL_MS || '60000', 10);
const cache = new Map();

function cacheKey(req) {
  return `${req.method}:${req.originalUrl}`;
}

const analyticsCache = (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = cacheKey(req);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    res.set('X-Cache', 'HIT');
    return res.json(hit.data);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cache.set(key, { data: body, ts: Date.now() });
    res.set('X-Cache', 'MISS');
    return originalJson(body);
  };

  next();
};

/** Call after mutations that affect analytics aggregates */
function invalidateAnalyticsCache() {
  for (const key of cache.keys()) {
    if (key.includes('/analytics/')) cache.delete(key);
  }
}

module.exports = { analyticsCache, invalidateAnalyticsCache };
