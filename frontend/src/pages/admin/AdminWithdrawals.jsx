import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/withdrawals?status=${status}&limit=50`);
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      toast.error('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, [status]);

  const approve = async (id) => {
    try {
      const { data } = await api.put(`/admin/withdrawals/${id}/approve`);
      if (data.success) { toast.success('Withdrawal approved!'); fetchWithdrawals(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const reject = async () => {
    try {
      const { data } = await api.put(`/admin/withdrawals/${rejectModal}/reject`, { note: rejectNote });
      if (data.success) { toast.success('Withdrawal rejected, amount refunded'); setRejectModal(null); setRejectNote(''); fetchWithdrawals(); }
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const statusColor = { pending: 'warning', approved: 'success', rejected: 'danger' };

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">💸 Manage Withdrawals</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`btn ${status === s ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : withdrawals.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No {status} withdrawals</div></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Account Details</th>
                  <th>Status</th>
                  <th>Date</th>
                  {status === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => {
                  let details = {};
                  try { details = typeof w.account_details === 'string' ? JSON.parse(w.account_details) : w.account_details || {}; } catch {}
                  return (
                    <tr key={w.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{w.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.email}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{w.reference}</td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '1rem' }}>${parseFloat(w.amount).toFixed(2)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{w.payment_method?.replace('_', ' ')}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {details.account_name && <div>{details.account_name}</div>}
                        {details.account_number && <div style={{ fontFamily: 'monospace' }}>{details.account_number}</div>}
                        {details.bank_name && <div>{details.bank_name}</div>}
                      </td>
                      <td><span className={`badge badge-${statusColor[w.status]}`}>{w.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(w.created_at).toLocaleString()}</td>
                      {status === 'pending' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => approve(w.id)} className="btn btn-sm btn-success">✓ Approve</button>
                            <button onClick={() => setRejectModal(w.id)} className="btn btn-sm btn-danger">✗ Reject</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reject Withdrawal</h3>
              <button className="modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>The amount will be refunded to the user's wallet.</p>
            <div className="form-group">
              <label className="form-label">Rejection Reason (optional)</label>
              <textarea className="form-input" rows={3} placeholder="Reason for rejection..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setRejectModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={reject} className="btn btn-danger" style={{ flex: 1 }}>Reject & Refund</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
