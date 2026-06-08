import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/deposits?status=${status}&limit=50`);
      setDeposits(data.deposits || []);
    } catch (err) {
      toast.error('Failed to fetch deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeposits(); }, [status]);

  const approve = async (id) => {
    try {
      const { data } = await api.put(`/admin/deposits/${id}/approve`);
      if (data.success) { toast.success('Deposit approved!'); fetchDeposits(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const reject = async () => {
    try {
      const { data } = await api.put(`/admin/deposits/${rejectModal}/reject`, { note: rejectNote });
      if (data.success) { toast.success('Deposit rejected'); setRejectModal(null); setRejectNote(''); fetchDeposits(); }
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const statusColor = { pending: 'warning', approved: 'success', rejected: 'danger' };

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">💳 Manage Deposits</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`btn ${status === s ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : deposits.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No {status} deposits</div></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Reference</th>
                  <th>Amount (RWF)</th>
                  <th>Original</th>
                  <th>Sender Phone</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Date</th>
                  {status === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.email}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.reference}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>
                      RF {Math.round(d.rwf_amount || d.amount).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {d.local_currency && d.local_currency !== 'RWF'
                        ? `${d.local_currency} ${parseFloat(d.local_amount||0).toLocaleString()}`
                        : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--info)' }}>
                      {d.sender_phone || '—'}
                    </td>
                    <td>
                      {d.transaction_id
                        ? <span style={{ background:'rgba(59,130,246,0.1)', padding:'0.2rem 0.5rem', borderRadius:'4px', color:'var(--info)', fontFamily:'monospace', fontSize:'0.8rem' }}>{d.transaction_id}</span>
                        : <span style={{ color:'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><span className={`badge badge-${statusColor[d.status]}`}>{d.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(d.created_at).toLocaleString()}</td>
                    {status === 'pending' && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => approve(d.id)} className="btn btn-sm btn-success">✓ Approve</button>
                          <button onClick={() => setRejectModal(d.id)} className="btn btn-sm btn-danger">✗ Reject</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reject Deposit</h3>
              <button className="modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Rejection Reason (optional)</label>
              <textarea className="form-input" rows={3} placeholder="Reason for rejection..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setRejectModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={reject} className="btn btn-danger" style={{ flex: 1 }}>Reject Deposit</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
