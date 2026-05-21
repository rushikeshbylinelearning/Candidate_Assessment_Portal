import React from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export default function FilterBar({ search, onSearch, filters, onFilter, roles, onClear }) {
  const hasActiveFilters = search || filters.role || filters.status || filters.experience;

  const selectStyle = (active) => ({
    padding: '8px 32px 8px 12px',
    border: `1px solid ${active ? '#FECDD3' : '#E2E8F0'}`,
    borderRadius: 9, fontSize: 13, outline: 'none',
    background: active ? '#FFF1F2' : '#F8FAFC',
    color: active ? '#E11D48' : '#475569',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer', appearance: 'none',
    minWidth: 130, transition: 'all 0.2s',
  });

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E4E7EC',
      borderRadius: 14,
      padding: '14px 16px',
      marginBottom: 16,
      boxShadow: '0 1px 3px rgba(16,24,40,0.06)',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
          <Search size={15} style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              width: '100%', padding: '8px 32px 8px 34px',
              border: '1px solid #E2E8F0', borderRadius: 9,
              fontSize: 13, outline: 'none', background: '#F8FAFC',
              color: '#0F172A', transition: 'all 0.2s', boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#F43F5E';
              e.target.style.background = '#fff';
              e.target.style.boxShadow = '0 0 0 3px rgba(244,63,94,0.08)';
            }}
            onBlur={e => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.background = '#F8FAFC';
              e.target.style.boxShadow = 'none';
            }}
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              style={{
                position: 'absolute', right: 9, top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', cursor: 'pointer', color: '#94A3B8',
                display: 'flex', padding: 2,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={filters.role}
            onChange={e => onFilter({ ...filters, role: e.target.value })}
            style={selectStyle(!!filters.role)}
          >
            <option value="">All Roles</option>
            {roles.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
          </select>
          <ChevronDown size={13} style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none',
          }} />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={filters.status}
            onChange={e => onFilter({ ...filters, status: e.target.value })}
            style={{ ...selectStyle(!!filters.status), minWidth: 140 }}
          >
            <option value="">All Statuses</option>
            {['pending', 'invited', 'in_progress', 'completed', 'expired'].map(s => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
          <ChevronDown size={13} style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none',
          }} />
        </div>

        {/* Experience filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={filters.experience || ''}
            onChange={e => onFilter({ ...filters, experience: e.target.value })}
            style={{ ...selectStyle(!!filters.experience), minWidth: 140 }}
          >
            <option value="">All Experience</option>
            {['intern', 'junior', 'mid', 'senior', 'lead'].map(l => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none',
          }} />
        </div>

        <div style={{ flex: 1 }} />

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 9,
              border: '1px solid #FECDD3', background: '#FFF1F2',
              color: '#E11D48', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFE4E6'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFF1F2'}
          >
            <X size={12} /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
