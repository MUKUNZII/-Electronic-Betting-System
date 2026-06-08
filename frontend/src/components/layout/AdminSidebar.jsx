import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiGrid, FiUsers, FiDollarSign, FiArrowDownCircle, FiArrowUpCircle,
  FiCalendar, FiList, FiTag, FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiTrendingUp
} from 'react-icons/fi';

const links = [
  { to: '/admin/dashboard',   icon: <FiGrid />,           label: 'Dashboard' },
  { to: '/admin/revenue',     icon: <FiTrendingUp />,     label: 'Revenue' },
  { to: '/admin/users',       icon: <FiUsers />,          label: 'Users' },
  { to: '/admin/deposits',    icon: <FiArrowDownCircle />,label: 'Deposits' },
  { to: '/admin/withdrawals', icon: <FiArrowUpCircle />,  label: 'Withdrawals' },
  { to: '/admin/events',      icon: <FiCalendar />,       label: 'Events' },
  { to: '/admin/bets',        icon: <FiList />,           label: 'All Bets' },
  { to: '/admin/promo-codes', icon: <FiTag />,            label: 'Promo Codes' },
];

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <aside style={{
      width: collapsed ? '64px' : '240px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', minHeight: '64px' }}>
        {!collapsed && (
          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
            🎰 Admin Panel
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.1rem', marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0 }}>
          {collapsed ? <FiMenu /> : <FiX />}
        </button>
      </div>

      {/* Admin info */}
      {!collapsed && user && (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Logged in as</div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>{user.full_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Administrator</div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        {links.map(link => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '0.25rem',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{link.icon}</span>
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem', borderRadius: '8px', width: '100%',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
          }}
        >
          <span style={{ flexShrink: 0 }}>{theme === 'dark' ? <FiSun /> : <FiMoon />}</span>
          {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem', borderRadius: '8px', width: '100%',
            background: 'none', border: 'none', color: 'var(--danger)',
            fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
          }}
        >
          <span style={{ flexShrink: 0 }}><FiLogOut /></span>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
