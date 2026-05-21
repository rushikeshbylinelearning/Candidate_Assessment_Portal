import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  UsersRound,
  Layers,
  ListChecks,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/hr/dashboard',          icon: Home,         label: 'Dashboard',   match: '/hr/dashboard' },
  { to: '/hr/candidates',         icon: UsersRound,   label: 'Candidates',  match: '/hr/candidates' },
  { to: '/hr/roles',              icon: Layers,       label: 'Roles',       match: '/hr/roles' },
  { to: '/hr/assessments/create', icon: ListChecks,   label: 'Assessments', match: '/hr/assessments' },
  { to: '/hr/analytics',          icon: TrendingUp,   label: 'Analytics',   match: '/hr/analytics' },
  { to: '/hr/notes',              icon: BarChart3,    label: 'Reports',     match: '/hr/notes' },
];

const COLLAPSED_W = 64;
const EXPANDED_W  = 220;

export default function Sidebar() {
  const { expanded, toggle } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const w = expanded ? EXPANDED_W : COLLAPSED_W;

  return (
    <aside
      style={{
        width: w,
        height: 'calc(100vh - var(--topbar-height))',
        background: '#0C1220',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 'var(--topbar-height)',
        zIndex: 100,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={toggle}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'flex-end' : 'center',
          width: '100%',
          height: 44,
          padding: expanded ? '0 14px' : '0',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)',
          flexShrink: 0,
          transition: 'all 0.25s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
      >
        <ChevronRight
          size={14}
          strokeWidth={2}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </button>

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: '10px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {navItems.map(({ to, icon: Icon, label, match }) => (
          <NavLink
            key={to}
            to={to}
            end={!match || match === to}
            title={!expanded ? label : undefined}
            style={({ isActive: exactActive }) => {
              const isActive = exactActive || (typeof window !== 'undefined' && match && window.location.pathname.startsWith(match));
              return {
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: 40,
                margin: '0 8px',
                padding: '0 10px',
                borderRadius: 8,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                transition: 'background 0.15s, color 0.15s',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(244,63,94,0.18)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              };
            }}
            onMouseEnter={e => {
              const active = e.currentTarget.getAttribute('aria-current') === 'page';
              if (!active) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              }
            }}
            onMouseLeave={e => {
              const active = e.currentTarget.getAttribute('aria-current') === 'page';
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                flexShrink: 0,
              }}
            >
              <Icon size={17} strokeWidth={1.75} />
            </span>
            {expanded && (
              <span style={{ fontSize: 13, letterSpacing: '-0.1px' }}>
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div
        style={{
          padding: '10px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Settings */}
        <button
          title={!expanded ? 'Settings' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 40,
            margin: '0 8px',
            padding: '0 10px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: 'background 0.15s, color 0.15s',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
            <SlidersHorizontal size={17} strokeWidth={1.75} />
          </span>
          {expanded && <span style={{ fontSize: 13 }}>Settings</span>}
        </button>

        {/* Sign out */}
        <button
          title={!expanded ? 'Sign out' : undefined}
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 40,
            margin: '0 8px',
            padding: '0 10px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: 'background 0.15s, color 0.15s',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.15)';
            e.currentTarget.style.color = '#F87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
            <LogOut size={17} strokeWidth={1.75} />
          </span>
          {expanded && <span style={{ fontSize: 13 }}>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
