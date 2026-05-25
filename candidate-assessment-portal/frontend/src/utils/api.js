import axios from 'axios';
import {
  cacheGet,
  cacheSet,
  shouldCacheGet,
  clearAllClientCache,
  invalidateCacheNamespaces,
  namespacesToInvalidate,
} from '../services/cacheService';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';

  if (method === 'get' && shouldCacheGet(url, config)) {
    const cached = cacheGet(url);
    if (cached !== null) {
      config.adapter = () => Promise.resolve({
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: { 'x-client-cache': 'HIT' },
        config,
        request: {},
      });
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    const method = (res.config.method || 'get').toLowerCase();
    const url = res.config.url || '';

    if (method === 'get' && res.status >= 200 && res.status < 300 && shouldCacheGet(url, res.config)) {
      if (!res.headers?.['x-client-cache']) {
        cacheSet(url, res.data);
      }
    }

    if (['post', 'put', 'patch', 'delete'].includes(method) && res.status >= 200 && res.status < 400) {
      const namespaces = namespacesToInvalidate(method, url);
      if (namespaces.length) invalidateCacheNamespaces(namespaces);
    }

    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cap_token');
      localStorage.removeItem('cap_user');
      clearAllClientCache();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/** Bypass client cache for a single request */
export function forceRefresh(config = {}) {
  return { ...config, forceRefresh: true };
}

export default api;
