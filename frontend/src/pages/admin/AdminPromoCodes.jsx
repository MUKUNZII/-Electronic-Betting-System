import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { code: '', discount_type: 'fixed', discount_value: '', min_deposit: '', max_uses: '', expires_at: '' };

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/promo-codes');
      setCodes(data.codes || []);
    } catch (err) {
      toast.error('Failed to fetch promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/promo-codes', form);
      if (data.success) {
        toast.success('Promo code created!');
        setModal(false);
        setForm(emptyForm);
        fetchCodes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create promo code');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">🎁 Promo Codes</h1>
          <p className="page-subtitle">Manage discount and bonus codes</p>
        </div>
        <button onClick={() => setModal(true)} className="btn btn-primary">+ Create Code</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : codes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎁</div>
            <div className="empty-state-title">No promo codes yet</div>
            <button onClick={() => setModal(true)} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Create First Code</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Min Deposit</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(code => (
                  <tr key={code.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{code.code}</td>
                    <td style={{ textTransform: 'capitalize' }}>{code.discount_type}</td>
                    <td style={{ fontWeight: 600 }}>
                      {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${parseFloat(code.discount_value).toFixed(2)}`}
                    </td>
                    <td>${parseFloat(code.min_deposit).toFixed(2)}</td>
                    <td>{code.used_count}{code.max_uses ? `/${code.max_uses}` : ' (unlimited)'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <span className={`badge ${code.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Promo Code</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input className="form-input" placeholder="e.g. WELCOME50" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type *</label>
                  <select className="form-input" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value *</label>
                  <input type="number" step="0.01" min="0.01" className="form-input" placeholder={form.discount_type === 'percentage' ? '10 (%)' : '25 ($)'} value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Min Deposit ($)</label>
                  <input type="number" step="0.01" min="0" className="form-input" placeholder="0" value={form.min_deposit} onChange={e => setForm({ ...form, min_deposit: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Uses</label>
                  <input type="number" min="1" className="form-input" placeholder="Unlimited" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input type="datetime-local" className="form-input" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Create Promo Code</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
