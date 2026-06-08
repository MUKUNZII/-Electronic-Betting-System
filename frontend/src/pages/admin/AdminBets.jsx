import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const statusColor = { pending: 'warning', won: 'success', lost: 'danger', cancelled: 'secondary' };

export default function AdminBets() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/bets?status=${status}&limit=100`)
      .then(({ data }) => setBets(data.bets || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">🎯 All Bets</h1>
        <p className="page-subtitle">View all bets placed on the platform</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['', 'All'], ['pending', 'Pending'], ['won', 'Won'], ['lost', 'Lost'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => setStatus(val)} className={`btn btn-sm ${status === val ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : bets.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🎯</div><div className="empty-state-title">No bets found</div></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Event</th>
                  <th>Selection</th>
                  <th>Odds</th>
                  <th>Stake</th>
                  <th>Potential Win</th>
                  <th>Actual Win</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bets.map(bet => (
                  <tr key={bet.id}>
                    <td style={{ fontWeight: 600 }}>{bet.username}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{bet.event_title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{bet.selection?.replace('_', ' ')}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{parseFloat(bet.odds).toFixed(2)}x</td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(bet.stake).toFixed(2)}</td>
                    <td style={{ color: 'var(--success)' }}>${parseFloat(bet.potential_winnings).toFixed(2)}</td>
                    <td style={{ color: parseFloat(bet.actual_winnings) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {parseFloat(bet.actual_winnings) > 0 ? `$${parseFloat(bet.actual_winnings).toFixed(2)}` : '-'}
                    </td>
                    <td><span className={`badge badge-${statusColor[bet.status]}`}>{bet.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(bet.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
