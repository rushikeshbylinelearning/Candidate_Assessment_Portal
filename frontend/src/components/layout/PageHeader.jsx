import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 24,
    }}>
      <div>
        <h1 style={{ 
          fontSize: 22, 
          fontWeight: 500, 
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.3px',
          marginBottom: 4,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: 13,
            fontWeight: 400,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
