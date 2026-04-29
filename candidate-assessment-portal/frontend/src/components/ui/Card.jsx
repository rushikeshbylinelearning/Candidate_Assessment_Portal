import React from 'react';

export default function Card({ children, style, className, onClick, glass = false, hover = false }) {
  const baseStyle = {
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        ...baseStyle,
        borderRadius: 12,
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      } : undefined}
    >
      {children}
    </div>
  );
}
