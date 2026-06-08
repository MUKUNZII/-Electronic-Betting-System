import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiSun, FiMoon, FiBell, FiMenu, FiX,
  FiUser, FiLogOut, FiSettings, FiEye, FiEyeOff,
  FiPlusCircle,
} from 'react-icons/fi';
import api from '../../services/api';

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString();

// Persist hide preference in localStorage
const HIDE_KEY = 'balance_hidden';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [balance, setBalance]         = useState(null);
  const [balanceHidden, setBalanceHidden] = useState(
    () => localStorage.getItem(HIDE_KEY) === 'true'
  );

  // Fetch balance + unread count on every route change
  const fetchNavData = useCallback(async () => {
    if (!user) return;
    try {
      const [notifRes, walletRes] = await Promise.all([
        api.get('/notifications?limit=1'),
        api.get('/wallet'),
      ]);
      if (notifRes.data.success) setUnreadCount(notifRes.data.unread);
      if (walletRes.data.success) setBalance(parseFloat(walletRes.data.wallet.balance));
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => { fetchNavData(); }, [fetchNavData, location.pathname]);

  const toggleHide = () => {
    setBalanceHidden(prev => {
      localStorage.setItem(HIDE_KEY, String(!prev));
      return !prev;
    });
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to: '/dashboard',   label: 'Dashboard' },
    { to: '/betting',     label: 'Bet Now' },
    { to: '/deposit',     label: 'Deposit' },
    { to: '/withdraw',    label: 'Withdraw' },
    { to: '/bet-history', label: 'History' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(10px)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

        {/* ── Logo ── */}
        <Link to={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
          <span style={{ fontSize: '1.5rem' }}>🎰</span>
          <span style={{ color: 'var(--primary)' }}>BetSystem</span>
        </Link>

        {/* ── Desktop nav links ── */}
        {user && (
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', overflow: 'hidden' }} className="desktop-nav">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} style={{
                padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap',
                color: location.pathname === link.to ? 'var(--primary)' : 'var(--text-secondary)',
                background: location.pathname === link.to ? 'rgba(245,158,11,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Right side ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

          {/* Theme toggle */}
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.1rem', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>

          {user ? (
            <>
              {/* ── Notification bell ── */}
              <Link to="/notifications" title="Notifications"
                style={{ position: 'relative', color: 'var(--text-secondary)', fontSize: '1.1rem', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                <FiBell />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    background: 'var(--danger)', color: '#fff',
                    borderRadius: '50%', width: '16px', height: '16px',
                    fontSize: '0.62rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* ── BALANCE WIDGET ── */}
              {balance !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  background: 'var(--bg-dark)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '0.375rem 0.625rem',
                  minWidth: balanceHidden ? 'auto' : '130px',
                }}>
                  {/* Deposit shortcut */}
                  <Link to="/deposit" title="Deposit funds"
                    style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <FiPlusCircle size={14} />
                  </Link>

                  {/* Balance amount */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1, marginBottom: '0.1rem' }}>
                      Balance
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', lineHeight: 1, letterSpacing: '0.01em' }}>
                      {balanceHidden
                        ? <span style={{ letterSpacing: '0.15em', color: 'var(--text-muted)' }}>••••••</span>
                        : `RF ${fmt(balance)}`
                      }
                    </div>
                  </div>

                  {/* Show / Hide toggle */}
                  <button onClick={toggleHide} title={balanceHidden ? 'Show balance' : 'Hide balance'}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {balanceHidden ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                  </button>
                </div>
              )}

              {/* ── Profile dropdown ── */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'var(--bg-dark)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '0.375rem 0.75rem',
                    color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer',
                  }}>
                  {user.profile_photo
                    ? <img src={`http://localhost:5000/${user.profile_photo}`} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    : <FiUser size={14} />
                  }
                  <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hide-sm">
                    {user.username || user.full_name}
                  </span>
                </button>

                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setDropdownOpen(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '0.5rem', minWidth: '200px',
                      boxShadow: 'var(--shadow)', zIndex: 200,
                    }}>
                      {/* User info */}
                      <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.375rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.full_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{user.email}</div>
                        {/* Balance in dropdown too */}
                        <div style={{ marginTop: '0.5rem', padding: '0.375rem 0.5rem', background: 'var(--bg-dark)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wallet</span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
                            {balanceHidden ? '••••••' : `RF ${fmt(balance)}`}
                          </span>
                        </div>
                      </div>

                      <Link to="/deposit" onClick={() => setDropdownOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                        <FiPlusCircle size={14} /> Deposit Funds
                      </Link>
                      <Link to="/profile" onClick={() => setDropdownOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <FiSettings size={14} /> Profile Settings
                      </Link>
                      <button onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--danger)', background: 'none', border: 'none', width: '100%', cursor: 'pointer', marginTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                        <FiLogOut size={14} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', display: 'none', cursor: 'pointer' }}>
                {menuOpen ? <FiX /> : <FiMenu />}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {user && menuOpen && (
        <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '1rem' }}>
          {/* Balance in mobile menu */}
          {balance !== null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wallet Balance</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                  {balanceHidden ? '••••••' : `RF ${fmt(balance)}`}
                </div>
              </div>
              <button onClick={toggleHide}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
                {balanceHidden ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
          )}
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.25rem', fontWeight: 500,
                color: location.pathname === link.to ? 'var(--primary)' : 'var(--text-secondary)',
                background: location.pathname === link.to ? 'rgba(245,158,11,0.1)' : 'transparent',
              }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .desktop-nav { display: none !important; } .mobile-menu-btn { display: block !important; } }
        @media (max-width: 600px) { .hide-sm { display: none !important; } }
      `}</style>
    </nav>
  );
}
