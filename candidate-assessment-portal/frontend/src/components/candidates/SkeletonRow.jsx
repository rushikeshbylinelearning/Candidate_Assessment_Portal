import React from 'react';

function Skeleton({ width, height = 12, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  );
}

export default function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Skeleton width={36} height={36} radius={10} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width={120} />
            <Skeleton width={90} height={10} />
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}><Skeleton width={80} height={22} radius={6} /></td>
      <td style={{ padding: '14px 16px' }}><Skeleton width={60} height={22} radius={6} /></td>
      <td style={{ padding: '14px 16px' }}><Skeleton width={70} height={22} radius={5} /></td>
      <td style={{ padding: '14px 16px' }}><Skeleton width={80} height={22} radius={99} /></td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton width={60} height={5} radius={99} />
          <Skeleton width={28} height={12} radius={4} />
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}><Skeleton width={70} height={22} radius={99} /></td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Skeleton width={64} height={28} radius={7} />
          <Skeleton width={64} height={28} radius={7} />
          <Skeleton width={30} height={28} radius={7} />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonStyle() {
  return (
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}
