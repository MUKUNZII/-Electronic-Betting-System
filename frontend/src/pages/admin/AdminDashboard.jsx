import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => {
      setData(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner" /></div></AdminLayout>;

  const stats = data?.stats || {};

  const chartData = {
    labels: ['Revenue', 'Paid Out', 'Pending Deposits', 'Pending Withdrawals'],
    datasets: [{
      label: 'Amount ($)',
      data: [
        parseFloat(stats.total_revenue || 0),
        parseFloat(stats.total_paid_out || 0),
        parseFloat(stats.pending_deposits_amount || 0),
        parseFloat(stats.pending_withdrawals_amount || 0),
      ],
      backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(59,130,246,0.7)'],
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
    },
  };

  const statusColor = { pending: 'warning', won: 'success', lost: 'danger', cancelled: 'secondary', approved: 'success', rejected: 'danger' };

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">📊 Admin Dashboard</h1>
        <p className="page-subtitle">System overview and statistics</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Users', value: stats.total_users || 0, icon: '👥', color: '#3b82f6' },
          { label: 'Total Bets', value: stats.total_bets || 0, icon: '🎯', color: '#8b5cf6' },
          { label: 'Total Revenue', value: `$${parseFloat(stats.total_revenue || 0).toFixed(2)}`, icon: '💰', color: '#22c55e' },
          { label: 'Total Paid Out', value: `$${parseFloat(stats.total_paid_out || 0).toFixed(2)}`, icon: '💸', color: '#ef4444' },
          { label: 'Pending Deposits', value: stats.pending_deposits || 0, icon: '⏳', color: '#f59e0b' },
          { label: 'Pending Withdrawals', value: stats.pending_withdrawals || 0, icon: '⏳', color: '#f59e0b' },
          { label: 'Active Events', value: stats.active_events || 0, icon: '📅', color: '#06b6d4' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20`, fontSize: '1.25rem' }}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.4rem', color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Financial Overview</h3>
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Deposits</h3>
          {(data?.recent_deposits || []).slice(0, 6).map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.reference}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>${parseFloat(d.amount).toFixed(2)}</div>
                <span className={`badge badge-${statusColor[d.status]}`}>{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Bets</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Event</th>
                <th>Selection</th>
                <th>Odds</th>
                <th>Stake</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent_bets || []).map(bet => (
                <tr key={bet.id}>
                  <td style={{ fontWeight: 600 }}>{bet.username}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bet.event_title}</td>
                  <td style={{ textTransform: 'capitalize' }}>{bet.selection?.replace('_', ' ')}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{parseFloat(bet.odds).toFixed(2)}x</td>
                  <td style={{ fontWeight: 600 }}>${parseFloat(bet.stake).toFixed(2)}</td>
                  <td><span className={`badge badge-${statusColor[bet.status]}`}>{bet.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(bet.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
