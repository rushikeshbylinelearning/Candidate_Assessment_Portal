/**
 * In-memory LRU cache for GET responses (shared-hosting safe: bounded size, TTL, per-user keys).
 */

const appLogger = require('../utils/appLogger');

const MAX_ENTRIES = parseInt(process.env.CACHE_MAX_ENTRIES || '300', 10);
const DEFAULT_TTL_MS = parseInt(process.env.CACHE_DEFAULT_TTL_MS || '60000', 10);

/** @type {Map<string, { data: unknown, expiresAt: number, namespace: string }>} */
const store = new Map();

const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  evictions: 0,
  invalidations: 0,
};

const NAMESPACE_TTL = {
  analytics: parseInt(process.env.CACHE_TTL_ANALYTICS_MS || '90000', 10),
  roles: parseInt(process.env.CACHE_TTL_ROLES_MS || '120000', 10),
  assessments: parseInt(process.env.CACHE_TTL_ASSESSMENTS_MS || '120000', 10),
  questions: parseInt(process.env.CACHE_TTL_QUESTIONS_MS || '120000', 10),
  candidates: parseInt(process.env.CACHE_TTL_CANDIDATES_MS || '45000', 10),
  responses: parseInt(process.env.CACHE_TTL_RESPONSES_MS || '30000', 10),
};

function ttlForNamespace(namespace) {
  return NAMESPACE_TTL[namespace] ?? DEFAULT_TTL_MS;
}

function buildKey(namespace, scope, method, url) {
  return `${namespace}:${scope}:${method}:${url}`;
}

function pruneExpired() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

function evictIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  pruneExpired();
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
    stats.evictions += 1;
  }
}

function get(namespace, scope, method, url) {
  const key = buildKey(namespace, scope, method, url);
  const entry = store.get(key);
  if (!entry) {
    stats.misses += 1;
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    stats.misses += 1;
    return null;
  }
  stats.hits += 1;
  return entry.data;
}

function set(namespace, scope, method, url, data, ttlMs) {
  const key = buildKey(namespace, scope, method, url);
  const ttl = ttlMs ?? ttlForNamespace(namespace);
  store.set(key, {
    data,
    namespace,
    expiresAt: Date.now() + ttl,
  });
  stats.sets += 1;
  evictIfNeeded();
}

function invalidateNamespace(namespace) {
  let count = 0;
  for (const [key, entry] of store.entries()) {
    if (entry.namespace === namespace) {
      store.delete(key);
      count += 1;
    }
  }
  stats.invalidations += count;
  if (count > 0) {
    appLogger.info(`Cache invalidated namespace="${namespace}" (${count} keys)`);
  }
}

function invalidateNamespaces(namespaces) {
  namespaces.forEach(invalidateNamespace);
}

function clearAll() {
  const size = store.size;
  store.clear();
  stats.invalidations += size;
}

function getStats() {
  pruneExpired();
  return {
    size: store.size,
    maxEntries: MAX_ENTRIES,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits + stats.misses > 0
      ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
      : 0,
    sets: stats.sets,
    evictions: stats.evictions,
    invalidations: stats.invalidations,
    namespaces: Object.keys(NAMESPACE_TTL),
  };
}

module.exports = {
  get,
  set,
  invalidateNamespace,
  invalidateNamespaces,
  clearAll,
  getStats,
  ttlForNamespace,
  buildKey,
};
