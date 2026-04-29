import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function HRLayout() {
  const auth = useAuth();
  if (!auth) return null; // context not ready yet (hot-reload edge case)
  const { isAuthenticated } = auth;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Topbar />
      <Sidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)', 
        marginTop: 'var(--topbar-height)',
        padding: '24px 28px', 
        minHeight: 'calc(100vh - var(--topbar-height))', 
        background: 'var(--color-background-tertiary)',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
