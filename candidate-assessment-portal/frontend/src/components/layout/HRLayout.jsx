import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const COLLAPSED_W = 64;
const EXPANDED_W  = 220;
const TOPBAR_H = 48;

function LayoutInner() {
  const { isAuthenticated } = useAuth();
  const { expanded } = useSidebar();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const sidebarW = expanded ? EXPANDED_W : COLLAPSED_W;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden', // ❗ CRITICAL: prevents page scroll
      background: '#F7F4F1',
    }}>
      <Topbar />
      <Sidebar />
      
      {/* Main content area — fills remaining height */}
      <main style={{
        flex: 1,
        marginLeft: sidebarW,
        marginTop: TOPBAR_H,
        display: 'flex',
        flexDirection: 'column',
        height: `calc(100vh - ${TOPBAR_H}px)`,
        overflow: 'hidden', // ❗ CRITICAL: child controls scroll
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function HRLayout() {
  const auth = useAuth();
  if (!auth) return null;

  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
