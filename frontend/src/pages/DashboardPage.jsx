import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiActivity, FiAlertCircle } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [recentBets, setRecentBets] = useState([]);
  const [betStats, setBetStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [eventStats, setEventStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, slipsRes, statsRes, notifRes, eventStatsRes] = await Promise.all([
          api.get('/wallet'),
          api.get('/betslip?limit=5'),
          api.get('/betslip/stats'),
          api.get('/notifications?limit=5'),
          api.get('/events/stats'),
        ]);
        setWallet(walletRes.data.wallet);
        setRecentBets(slipsRes.data.slips || []);
        setBetStats(statsRes.data.stats);
        setNotifications(notifRes.data.notifications);
        setEventStats(eventStatsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Winnings ($)',
      data: [0, 50, 30, 80, 45, 120, parseFloat(wallet?.total_winnings || 0)],
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
    },
  };

  const statusColor = { pending: 'warning', won: 'success', lost: 'danger', cancelled: 'secondary' };

  if (loading) return (
    <>
      <Navbar />
      <div className="loading-spinner"><div className="spinner" /></div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Here's your betting overview</p>
        </div>

        {/* Email verification warning */}
        {!user?.is_verified && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            <FiAlertCircle />
            <div>
              <strong>Email not verified.</strong> To enable email verification, add your Gmail credentials to <code>backend/.env</code> and set <code>DEV_AUTO_VERIFY=false</code>.{' '}
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                See README for Gmail App Password setup.
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Wallet balance → go deposit */}
          <Link to="/deposit" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='rgba(245,158,11,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='var(--border)'; }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>💰</div>
              <div>
                <div className="stat-value">RF {Math.round(parseFloat(wallet?.balance || 0)).toLocaleString()}</div>
                <div className="stat-label">Wallet Balance (RWF)</div>
                <div style={{ fontSize:'0.72rem', color:'var(--primary)', marginTop:'0.25rem', fontWeight:600 }}>+ Deposit →</div>
              </div>
            </div>
          </Link>
          {/* Total deposited → deposit history */}
          <Link to="/deposit" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='var(--border)'; }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>📥</div>
              <div>
                <div className="stat-value">RF {Math.round(parseFloat(wallet?.total_deposited || 0)).toLocaleString()}</div>
                <div className="stat-label">Total Deposited</div>
                <div style={{ fontSize:'0.72rem', color:'#3b82f6', marginTop:'0.25rem', fontWeight:600 }}>View history →</div>
              </div>
            </div>
          </Link>
          {/* Total winnings → bet history */}
          <Link to="/bet-history" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='rgba(34,197,94,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='var(--border)'; }}>
              <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>🏆</div>
              <div>
                <div className="stat-value">RF {Math.round(parseFloat(wallet?.total_winnings || 0)).toLocaleString()}</div>
                <div className="stat-label">Total Winnings</div>
                <div style={{ fontSize:'0.72rem', color:'var(--success)', marginTop:'0.25rem', fontWeight:600 }}>View bets →</div>
              </div>
            </div>
          </Link>
          <Link
            to="/betting"
            style={{ textDecoration: 'none' }}
            onClick={() => {
              // Store the filter preference so BettingPage can pick it up
              sessionStorage.setItem('betting_tab', 'live');
            }}
          >
            <div
              className="stat-card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(239,68,68,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* Pulsing live dot */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', flexShrink: 0,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 0 0 rgba(239,68,68,0.4)',
                  animation: eventStats?.live > 0 ? 'livePulse 1.5s infinite' : 'none',
                }} />
              </div>
              <div>
                <div className="stat-value" style={{ color: eventStats?.live > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                  {eventStats?.live || 0} Live
                </div>
                <div className="stat-label">
                  {eventStats?.upcoming || 0} upcoming events
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 600 }}>
                  View all →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Bet stats row */}
        {betStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Bets',   value: betStats.total || 0,        color: '#3b82f6' },
              { label: 'Won',          value: betStats.won || 0,           color: '#22c55e' },
              { label: 'Lost',         value: betStats.lost || 0,          color: '#ef4444' },
              { label: 'Pending',      value: betStats.pending || 0,       color: '#f59e0b' },
              { label: 'Accumulators', value: betStats.accumulators || 0,  color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Chart */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Winnings Overview</h3>
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { to: '/betting', icon: '🎯', label: 'Place Bet', color: '#f59e0b' },
                { to: '/deposit', icon: '💳', label: 'Deposit', color: '#22c55e' },
                { to: '/withdraw', icon: '💸', label: 'Withdraw', color: '#3b82f6' },
                { to: '/bet-history', icon: '📋', label: 'History', color: '#8b5cf6' },
              ].map(action => (
                <Link
                  key={action.to}
                  to={action.to}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-dark)',
                    border: '1px solid var(--border)', gap: '0.5rem', transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = `${action.color}15`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-dark)'; }}
                >
                  <span style={{ fontSize: '1.75rem' }}>{action.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Recent bets */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700 }}>Recent Bets</h3>
              <a href="/bet-history" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View all →</a>
            </div>
            {recentBets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <div className="empty-state-title">No bets yet</div>
                <a href="/betting" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Place First Bet</a>
              </div>
            ) : (
              recentBets.map(slip => (
                <div key={slip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {slip.slip_type === 'accumulator'
                        ? `🎰 Accumulator (${slip.legs?.length || 0} legs)`
                        : `🎯 ${slip.legs?.[0]?.team_a} vs ${slip.legs?.[0]?.team_b}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {parseFloat(slip.total_odds).toFixed(2)}x odds
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>RF {Math.round(slip.total_stake).toLocaleString()}</div>
                    <span className={`badge badge-${slip.status === 'won' ? 'success' : slip.status === 'lost' ? 'danger' : slip.status === 'pending' ? 'warning' : 'secondary'}`}>
                      {slip.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notifications */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700 }}>Notifications</h3>
              <Link to="/notifications" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View all →</Link>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔔</div>
                <div className="empty-state-title">No notifications</div>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'var(--border)' : 'var(--primary)', marginTop: '0.4rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: '0.875rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{n.message.substring(0, 60)}...</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
