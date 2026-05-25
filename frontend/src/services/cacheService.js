/**
 * Client-side GET cache — survives page reload via sessionStorage (per browser tab).
 * Keys are scoped by user id so accounts on the same machine do not share data.
 */

const STORAGE_PREFIX = 'cap_cache_v1';

const TTL_MS = {
  analytics: 90_000,
  roles: 120_000,
  assessments: 120_000,
  questions: 120_000,
  candidates: 45_000,
  responses: 30_000,
  default: 60_000,
};

const memory = new Map();

const SKIP_URL_PATTERNS = [
  /\/auth\//i,
  /\/tokens\//i,
  /\/status$/i,
  /\/pipeline\/session/i,
  /nocache=1/i,
];

const NS_URL_MARKERS = {
  analytics: '/analytics',
  roles: '/roles',
  assessments: '/assessments',
  questions: '/questions',
  responses: '/responses',
  candidates: null,
};

function userScope() {
  try {
    const raw = localStorage.getItem('cap_user');
    if (!raw) return 'anon';
    const user = JSON.parse(raw);
    return user.id || user._id || user.email || 'anon';
  } catch {
    return 'anon';
  }
}

function namespaceForUrl(url) {
  const path = url.split('?')[0];
  if (path.includes('/analytics/')) return 'analytics';
  if (path.includes('/roles')) return 'roles';
  if (path.includes('/assessments')) return 'assessments';
  if (path.includes('/questions')) return 'questions';
  if (path.includes('/responses')) return 'responses';
  if (path.includes('/candidates') || path.includes('/resume/') || path.includes('/notes')) {
    return 'candidates';
  }
  return 'default';
}

function storageKey(cacheKey) {
  return `${STORAGE_PREFIX}:${cacheKey}`;
}

function buildCacheKey(url) {
  return `${userScope()}:GET:${url}`;
}

function urlMatchesNamespace(url, namespace) {
  if (namespace === 'candidates') {
    return /\/(candidates|resume|notes)(\/|$)/.test(url);
  }
  const marker = NS_URL_MARKERS[namespace];
  return marker ? url.includes(marker) : false;
}

export function shouldCacheGet(url, config = {}) {
  if (config.forceRefresh || config.params?.nocache === '1') return false;
  return !SKIP_URL_PATTERNS.some((re) => re.test(url));
}

function readFromSession(cacheKey) {
  try {
    const raw = sessionStorage.getItem(storageKey(cacheKey));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry.expiresAt <= Date.now()) {
      sessionStorage.removeItem(storageKey(cacheKey));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeToSession(cacheKey, data, ttlMs) {
  try {
    const payload = JSON.stringify({ data, expiresAt: Date.now() + ttlMs });
    if (payload.length > 512_000) return;
    sessionStorage.setItem(storageKey(cacheKey), payload);
    pruneStorageIfNeeded();
  } catch {
    /* quota exceeded */
  }
}

function pruneStorageIfNeeded() {
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    if (keys.length <= 80) return;
    keys.sort().slice(0, keys.length - 60).forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function cacheGet(url) {
  const key = buildCacheKey(url);
  const mem = memory.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.data;

  const stored = readFromSession(key);
  if (stored !== null) {
    memory.set(key, { data: stored, expiresAt: Date.now() + 10_000 });
    return stored;
  }
  return null;
}

export function cacheSet(url, data) {
  const key = buildCacheKey(url);
  const ns = namespaceForUrl(url);
  const ttl = TTL_MS[ns] ?? TTL_MS.default;
  memory.set(key, { data, expiresAt: Date.now() + ttl });
  writeToSession(key, data, ttl);
}

export function invalidateCacheNamespaces(namespaces) {
  const scope = userScope();

  for (const key of [...memory.keys()]) {
    const urlPart = key.slice(`${scope}:GET:`.length);
    if (namespaces.some((ns) => urlMatchesNamespace(urlPart, ns))) {
      memory.delete(key);
    }
  }

  try {
    const prefix = `${STORAGE_PREFIX}:`;
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (!k?.startsWith(prefix)) continue;
      const cacheKey = k.slice(prefix.length);
      const getIdx = cacheKey.indexOf(':GET:');
      if (getIdx === -1) continue;
      const urlPart = cacheKey.slice(getIdx + 5);
      if (namespaces.some((ns) => urlMatchesNamespace(urlPart, ns))) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}

export function clearAllClientCache() {
  memory.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

export function namespacesToInvalidate(method, url) {
  if (!['post', 'put', 'patch', 'delete'].includes(method?.toLowerCase())) return [];
  const path = (url || '').split('?')[0];
  const list = [];
  if (/\/(candidates|resume|notes)(\/|$)/.test(path)) list.push('candidates', 'analytics');
  if (path.includes('/roles')) list.push('roles', 'analytics', 'candidates');
  if (path.includes('/assessments')) list.push('assessments');
  if (path.includes('/questions')) list.push('questions');
  if (path.includes('/responses')) list.push('responses', 'candidates', 'analytics');
  return [...new Set(list)];
}
