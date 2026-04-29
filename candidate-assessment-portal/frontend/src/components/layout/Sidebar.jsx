import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileQuestion, BarChart3,
  MessageSquare, Settings, LogOut
} from 'lucide-react';

const navItems = [
  { to: '/hr/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hr/candidates', icon: Users, label: 'Candidates' },
  { to: '/hr/roles', icon: Briefcase, label: 'Roles' },
  { to: '/hr/questions', icon: FileQuestion, label: 'Question Bank' },
  { to: '/hr/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/hr/notes', icon: MessageSquare, label: 'Reports' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--color-background-primary)',
      borderRight: '0.5px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 'var(--topbar-height)',
      zIndex: 100,
    }}>
      {/* Nav */}
      <nav style={{ 
        flex: 1, 
        padding: '12px 6px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 4,
      }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink 
            key={to} 
            to={to} 
            title={label}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              margin: '0 auto',
              borderRadius: 8,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-background-secondary)' : 'transparent',
              textDecoration: 'none',
              position: 'relative',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--color-background-secondary)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </NavLink>
        ))}
      </nav>

      {/* Bottom icons */}
      <div style={{ 
        padding: '12px 6px', 
        borderTop: '0.5px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <button
          title="Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            margin: '0 auto',
            borderRadius: 8,
            color: 'var(--color-text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.background = 'var(--color-background-secondary)'; 
            e.currentTarget.style.color = 'var(--color-text-primary)'; 
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.background = 'transparent'; 
            e.currentTarget.style.color = 'var(--color-text-secondary)'; 
          }}
        >
          <Settings size={18} strokeWidth={2} />
        </button>
        <button
          title="Sign out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            margin: '0 auto',
            borderRadius: 8,
            color: 'var(--color-text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.background = 'var(--color-danger-light)'; 
            e.currentTarget.style.color = 'var(--color-danger)'; 
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.background = 'transparent'; 
            e.currentTarget.style.color = 'var(--color-text-secondary)'; 
          }}
        >
          <LogOut size={18} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
