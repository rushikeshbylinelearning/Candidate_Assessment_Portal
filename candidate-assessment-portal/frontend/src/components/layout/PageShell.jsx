import React from 'react';

/**
 * PageShell — standard page wrapper used by every HR page.
 *
 * Props:
 *   title       — page title (string)
 *   subtitle    — optional subtitle (string)
 *   actions     — optional ReactNode rendered top-right (buttons, etc.)
 *   scrollable  — if true, the content area scrolls; if false (default), content is static
 *   noPad       — removes inner padding (useful when content manages its own padding)
 *   children    — page content
 *
 * Layout produced:
 *   ┌─────────────────────────────────────────┐
 *   │  PageHeader (title + actions)  [static] │
 *   ├─────────────────────────────────────────┤
 *   │  children                               │
 *   │  (scrollable if scrollable=true)        │
 *   └─────────────────────────────────────────┘
 */
export default function PageShell({ title, subtitle, actions, children, scrollable = false, noPad = false }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',       // fills the <main> from HRLayout
      overflow: 'hidden',   // ❗ prevents this shell from scrolling
    }}>
      {/* ── Page header ── */}
      {(title || actions) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px 12px',
          flexShrink: 0,    // never shrinks — always visible
          gap: 12,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {title && (
              <h1 style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#0F172A',
                margin: 0,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p style={{
                fontSize: 13,
                color: '#64748B',
                margin: 0,
                fontWeight: 400,
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* ── Page body ── */}
      <div style={{
        flex: 1,
        overflowY: scrollable ? 'auto' : 'hidden',
        overflowX: 'hidden',
        minHeight: 0,       // ❗ CRITICAL for flex scroll to work
        padding: noPad ? 0 : '12px 24px 16px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {children}
      </div>
    </div>
  );
}
