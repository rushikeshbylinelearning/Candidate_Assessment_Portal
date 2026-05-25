import { useEffect, useState, useCallback, useRef } from 'react';
import api, { forceRefresh } from '../utils/api';

/**
 * GET hook with client cache (instant paint on page reload when data is fresh).
 * @param {string|null} url - API path e.g. '/roles?active=true'
 * @param {{ enabled?: boolean, initialData?: unknown }} options
 */
export function useCachedQuery(url, { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled && url));
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async (refresh = false) => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await api.get(url, refresh ? forceRefresh() : undefined);
      if (mounted.current) {
        setData(res.data);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) setError(err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    if (!enabled || !url) {
      setLoading(false);
      return undefined;
    }
    fetchData(false);
    return () => {
      mounted.current = false;
    };
  }, [url, enabled, fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh, setData };
}
