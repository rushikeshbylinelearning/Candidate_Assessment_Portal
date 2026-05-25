import { useEffect, useState, useRef } from 'react';
import api, { forceRefresh } from '../utils/api';
import { cacheGet, cacheSet } from '../services/cacheService';

const ENDPOINTS = [
  '/analytics/overview',
  '/analytics/funnel',
  '/analytics/performance',
];

async function fetchAnalyticsBundle({ refresh = false } = {}) {
  if (!refresh) {
    const cached = ENDPOINTS.map((url) => cacheGet(url));
    if (cached.every(Boolean)) {
      return {
        overview: cached[0],
        funnel: cached[1],
        performance: cached[2],
      };
    }
  }

  const cfg = refresh ? forceRefresh() : undefined;
  const [ov, fn, pf] = await Promise.all(
    ENDPOINTS.map((url) => api.get(url, cfg))
  );

  const data = {
    overview: ov.data,
    funnel: fn.data,
    performance: pf.data,
  };

  ENDPOINTS.forEach((url, i) => {
    cacheSet(url, [data.overview, data.funnel, data.performance][i]);
  });

  return data;
}

let inflight = null;

function loadBundle(refresh = false) {
  if (inflight && !refresh) return inflight;
  inflight = fetchAnalyticsBundle({ refresh }).finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Shared analytics data for Dashboard + Analytics (client + server cache). */
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
    loadBundle(false)
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
    setLoading(true);
    try {
      const data = await loadBundle(true);
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
