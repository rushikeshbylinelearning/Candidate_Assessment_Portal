import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircleUserRound, Settings, LogOut } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 48,
      background: '#ffffff',
      borderBottom: '1px solid #E8EDF2',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 16,
      zIndex: 200,
    }}>

      {/* ── Logo ── */}
      <img
        src="/Byline_logo.png"
        alt="Logo"
        style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }}
      />

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Right icons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#E11D48',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontFamily: '"Aptos", "Aptos Bold", "Segoe UI", sans-serif',
              fontSize: 12,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {initials}
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 299 }}
                onClick={() => setShowUserMenu(false)}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                zIndex: 300,
              }}>

                {/* User card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  background: '#FAFBFC',
                  borderBottom: '1px solid #F1F5F9',
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#E11D48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontFamily: '"Aptos", "Aptos Bold", "Segoe UI", sans-serif',
                    fontSize: 13,
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: '"Aptos", "Aptos Bold", "Segoe UI", sans-serif', color: '#0F172A' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: '"Aptos", "Segoe UI", sans-serif', color: '#94A3B8', marginTop: 1 }}>
                      {user?.email || user?.role}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px' }}>
                  <button
                    style={menuItemStyle('#64748B')}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <CircleUserRound size={15} strokeWidth={1.75} />
                    <span>My Profile</span>
                  </button>

                  <button
                    style={menuItemStyle('#64748B')}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <Settings size={15} strokeWidth={1.75} />
                    <span>Settings</span>
                  </button>

                  <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />

                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{
                      ...menuItemStyle('#E11D48'),
                      background: '#FFF1F2',
                      fontWeight: 700,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FFE4E8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFF1F2'; }}
                  >
                    <LogOut size={15} strokeWidth={1.75} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const iconBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

const menuItemStyle = (color) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: '"Aptos", "Aptos Bold", "Segoe UI", sans-serif',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 0.15s',
});
