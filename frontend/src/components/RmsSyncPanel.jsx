/**
 * RmsSyncPanel.jsx
 * Add this component inside the Admin/HR section of your Assessment Portal React app.
 *
 * Usage example in your routes/page:
 *   import RmsSyncPanel from './components/RmsSyncPanel';
 *   <RmsSyncPanel />
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ value }) {
  const styles = {
    Applied:   'bg-blue-100 text-blue-700',
    Screening: 'bg-yellow-100 text-yellow-700',
    Interview: 'bg-purple-100 text-purple-700',
    Offer:     'bg-green-100 text-green-700',
    Hired:     'bg-emerald-100 text-emerald-700',
    Rejected:  'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[value] || 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  );
}

function SyncStatusCard({ status, onRefresh }) {
  if (!status) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-6 mb-6">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${status.rmsReachable ? 'bg-green-500' : 'bg-red-400'}`} />
        <span className="text-sm font-medium text-gray-700">
          RMS {status.rmsReachable ? 'Connected' : 'Unreachable'}
        </span>
      </div>
      {status.rmsReachable && (
        <>
          <div className="text-sm text-gray-500">RMS candidates: <span className="font-semibold text-gray-800">{status.rmsTotal ?? '—'}</span></div>
          <div className="text-sm text-gray-500">Local candidates: <span className="font-semibold text-gray-800">{status.localTotal}</span></div>
        </>
      )}
      <button onClick={onRefresh} className="ml-auto text-xs text-indigo-600 hover:underline">Refresh</button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RmsSyncPanel() {
  const [status, setStatus]       = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected]   = useState(new Set());
  const [filters, setFilters]     = useState({ stage: '', search: '' });
  const [loading, setLoading]     = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  // ── fetch connectivity status
  const loadStatus = useCallback(async () => {
    try {
      const d = await apiFetch('/rms-sync/status');
      setStatus(d);
    } catch (e) {
      setStatus({ rmsReachable: false, localTotal: '—' });
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── preview candidates from RMS
  const handlePreview = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setCandidates([]);
    setSelected(new Set());
    try {
      const params = new URLSearchParams();
      if (filters.stage)  params.append('stage', filters.stage);
      if (filters.search) params.append('search', filters.search);
      const d = await apiFetch(`/rms-sync/candidates?${params}`);
      setCandidates(d.candidates || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── toggle row selection
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const eligible = candidates.filter((c) => !c.alreadyImported);
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((c) => String(c.id))));
    }
  };

  // ── run import
  const handleImport = async () => {
    setImporting(true);
    setError('');
    setResult(null);
    try {
      const body = {
        ...(filters.stage  ? { stage:  filters.stage  } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        ...(selected.size > 0 ? { candidateIds: [...selected] } : {}),
      };
      const d = await apiFetch('/rms-sync/import', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(d);
      await loadStatus();
      // Refresh preview to update alreadyImported flags
      await handlePreview();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const eligibleCount = candidates.filter((c) => !c.alreadyImported).length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Import from RMS</h2>
      <p className="text-sm text-gray-500 mb-6">
        Pull candidates from HR Workflow Management directly into the Assessment Portal.
      </p>

      {/* Connectivity */}
      <SyncStatusCard status={status} onRefresh={loadStatus} />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
          <select
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={filters.stage}
            onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}
          >
            <option value="">All stages</option>
            {['Applied','Screening','Interview','Offer','Hired','On Hold','Rejected'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            type="text"
            placeholder="Name, email, position…"
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
          />
        </div>
        <button
          onClick={handlePreview}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-1.5 rounded-lg transition"
        >
          {loading ? 'Loading…' : 'Preview'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Import result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm">
          <span className="font-semibold text-green-800">Import complete — </span>
          <span className="text-green-700">
            {result.imported} imported, {result.skipped} skipped (already exist)
          </span>
          {result.errors?.length > 0 && (
            <ul className="mt-2 text-red-600 list-disc list-inside">
              {result.errors.map((e, i) => (
                <li key={i}>{e.email}: {e.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Table */}
      {candidates.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{candidates.length}</span> candidates found —{' '}
              <span className="font-semibold text-indigo-700">{eligibleCount}</span> new
            </p>
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-5 py-1.5 rounded-lg transition"
            >
              {importing
                ? 'Importing…'
                : selected.size > 0
                  ? `Import ${selected.size} selected`
                  : 'Select candidates'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && selected.size === eligibleCount}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Position</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Stage</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Applied</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50 transition ${c.alreadyImported ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        disabled={c.alreadyImported}
                        checked={selected.has(String(c.id))}
                        onChange={() => toggleSelect(String(c.id))}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.position || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge value={c.stage} /></td>
                    <td className="px-4 py-3 text-gray-500">{c.appliedDate?.slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3">
                      {c.alreadyImported
                        ? <span className="text-xs text-gray-400">Already imported</span>
                        : <span className="text-xs text-emerald-600 font-medium">New</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && candidates.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Click <strong>Preview</strong> to load candidates from RMS.
        </div>
      )}
    </div>
  );
}
