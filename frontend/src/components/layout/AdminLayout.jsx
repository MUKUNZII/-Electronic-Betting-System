import React from 'react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: '2rem', background: 'var(--bg-dark)' }}>
        {children}
      </main>
    </div>
  );
}
