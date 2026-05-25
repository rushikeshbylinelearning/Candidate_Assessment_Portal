/** @deprecated Use httpCache('analytics') — kept for backward-compatible imports */
const { httpCache } = require('./httpCache');
const cacheService = require('../services/cache.service');

const analyticsCache = httpCache('analytics');

function invalidateAnalyticsCache() {
  cacheService.invalidateNamespace('analytics');
}

module.exports = { analyticsCache, invalidateAnalyticsCache };
