import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      gap: 24,
    }}>
      {/* Left: Title */}
      <div>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 700, 
          color: '#0f172a',
          letterSpacing: '-0.5px',
          marginBottom: 4,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ 
            color: '#64748b', 
            fontSize: 15,
            fontWeight: 500,
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Search + Notifications + Avatar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
      }}>
        {/* Search Bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: 14, 
              color: '#94a3b8',
              pointerEvents: 'none',
            }} 
          />
          <input
            type="text"
            placeholder="Search..."
            style={{
              width: 240,
              padding: '10px 14px 10px 42px',
              borderRadius: 12,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontSize: 14,
              fontWeight: 500,
              color: '#0f172a',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.2s',
              outline: 'none',
            }}
            onFocus={e => {
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)';
            }}
            onBlur={e => {
              e.target.style.background = 'rgba(255, 255, 255, 0.7)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
            }}
          />
        </div>

        {/* Notification Bell */}
        <button style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: 'none',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#64748b',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.2s',
          position: 'relative',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
          e.currentTarget.style.color = '#0f172a';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
          e.currentTarget.style.color = '#64748b';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
        }}
        >
          <Bell size={20} strokeWidth={2} />
          {/* Notification Badge */}
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#e11d48',
            border: '2px solid #f8fafc',
          }} />
        </button>

        {/* Profile Avatar */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(225, 29, 72, 0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(225, 29, 72, 0.3)';
        }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
