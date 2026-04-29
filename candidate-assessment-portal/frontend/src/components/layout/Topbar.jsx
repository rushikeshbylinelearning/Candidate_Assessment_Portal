import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Shield, ChevronDown } from 'lucide-react';

const navLinks = [
  { to: '/hr/dashboard', label: 'Dashboard' },
  { to: '/hr/candidates', label: 'Candidates' },
  { to: '/hr/roles', label: 'Roles' },
  { to: '/hr/questions', label: 'Question Bank' },
  { to: '/hr/analytics', label: 'Analytics' },
  { to: '/hr/notes', label: 'Reports' },
];

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      background: 'var(--color-background-primary)',
      borderBottom: '0.5px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 32,
      zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Shield size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.3px',
        }}>
          HireOS
        </span>
      </div>

      {/* Nav Links */}
      <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-background-secondary)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              position: 'relative',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Right: Search + Notifications + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search candidates, roles…"
            style={{
              width: 240,
              height: 36,
              padding: '0 14px 0 38px',
              borderRadius: 99,
              border: '0.5px solid var(--color-border)',
              background: 'var(--color-background-secondary)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={e => {
              e.target.style.background = 'var(--color-background-primary)';
              e.target.style.borderColor = 'var(--color-accent)';
            }}
            onBlur={e => {
              e.target.style.background = 'var(--color-background-secondary)';
              e.target.style.borderColor = 'var(--color-border)';
            }}
          />
        </div>

        {/* Notification Bell */}
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            position: 'relative',
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
          <Bell size={18} strokeWidth={2} />
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-accent)',
          }} />
        </button>

        {/* User Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px 4px 4px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-background-secondary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <ChevronDown size={14} color="var(--color-text-secondary)" />
          </button>

          {showUserMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 299,
                }}
                onClick={() => setShowUserMenu(false)}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 200,
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-lg)',
                padding: 8,
                zIndex: 300,
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '0.5px solid var(--color-border)',
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}>
                    {user?.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'capitalize',
                  }}>
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: 'left',
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
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
