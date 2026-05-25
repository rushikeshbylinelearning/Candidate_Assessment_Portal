const cacheService = require('../services/cache.service');

/**
 * After a successful write, invalidate related cache namespaces.
 * @param {string[]} namespaces
 */
function invalidateOnSuccess(namespaces) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        cacheService.invalidateNamespaces(namespaces);
      }
    });
    next();
  };
}

module.exports = { invalidateOnSuccess };
