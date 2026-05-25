import { useEffect, useState, useRef } from 'react';
import api from '../utils/api';

const CACHE_TTL_MS = 55_000;
let sharedCache = null;
let inflight = null;

async function fetchAnalyticsBundle() {
  if (sharedCache && Date.now() - sharedCache.ts < CACHE_TTL_MS) {
    return sharedCache.data;
  }
  if (inflight) return inflight;

  inflight = Promise.all([
    api.get('/analytics/overview'),
    api.get('/analytics/funnel'),
    api.get('/analytics/performance'),
  ]).then(([ov, fn, pf]) => {
    const data = { overview: ov.data, funnel: fn.data, performance: pf.data };
    sharedCache = { data, ts: Date.now() };
    return data;
  }).finally(() => {
    inflight = null;
  });

  return inflight;
}

/** Shared analytics data for Dashboard + Analytics pages (dedupes API calls). */
export function useAnalytics({ enabled = true } = {}) {
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return undefined;

    setLoading(true);
    fetchAnalyticsBundle()
      .then((data) => {
        if (!mounted.current) return;
        setOverview(data.overview);
        setFunnel(data.funnel);
        setPerformance(data.performance);
        setError(null);
      })
      .catch((err) => {
        if (mounted.current) setError(err);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => {
      mounted.current = false;
    };
  }, [enabled]);

  const refresh = async () => {
    sharedCache = null;
    setLoading(true);
    try {
      const data = await fetchAnalyticsBundle();
      setOverview(data.overview);
      setFunnel(data.funnel);
      setPerformance(data.performance);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { overview, funnel, performance, loading, error, refresh };
}

export function invalidateAnalyticsClientCache() {
  sharedCache = null;
}
