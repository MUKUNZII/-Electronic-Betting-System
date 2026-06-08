import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RECEIVING_NUMBER = '+250784214441';
const fmt = (n) => Math.round(Number(n || 0)).toLocaleString();

export default function AdminRevenue() {
  const [revenue, setRevenue] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ amount: '', note: '' });
  const [success, setSuccess] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, histRes] = await Promise.all([
        api.get('/admin/revenue'),
        api.get('/admin/revenue/history'),
      ]);
      setRevenue(revRes.data.revenue);
      setHistory(histRes.data.history || []);
    } catch (err) {
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount < 1000) { toast.error('Minimum withdrawal is RF 1,000'); return; }
    if (amount > revenue.available_to_withdraw) {
      toast.error(`Max available: RF ${fmt(revenue.available_to_withdraw)}`);
      return;
    }
    setWithdrawing(true);
    try {
      const { data } = await api.post('/admin/revenue/withdraw', form);
      if (data.success) {
        setSuccess(data.withdrawal);
        setModal(false);
        setForm({ amount: '', note: '' });
        toast.success('Revenue withdrawal recorded!');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const quickAmounts = revenue
    ? [
        Math.floor(revenue.available_to_withdraw * 0.25),
        Math.floor(revenue.available_to_withdraw * 0.5),
        Math.floor(revenue.available_to_withdraw * 0.75),
        Math.floor(revenue.available_to_withdraw),
      ].filter(v => v >= 1000)
    : [];

  if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">💰 Revenue Management</h1>
          <p className="page-subtitle">Platform earnings — withdraw to {RECEIVING_NUMBER}</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="btn btn-primary btn-lg"
          disabled={!revenue || revenue.available_to_withdraw < 1000}
        >
          💸 Withdraw Revenue
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>✅ Withdrawal Recorded!</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>Reference: <strong style={{ fontFamily: 'monospace' }}>{success.reference}</strong></div>
            <div>Amount: <strong>RF {fmt(success.amount)}</strong></div>
            <div>Send to: <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{success.receiving_number}</strong></div>
          </div>
          <button onClick={() => setSuccess(null)} style={{ marginTop: '0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.375rem 0.875rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>Dismiss</button>
        </div>
      )}

      {/* Revenue stats */}
      {revenue && (
        <>
          {/* Main available balance */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
            border: '2px solid rgba(245,158,11,0.4)',
            borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available to Withdraw</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
              RF {fmt(revenue.available_to_withdraw)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Rwandan Franc · Sends to {RECEIVING_NUMBER}
            </div>
            {revenue.available_to_withdraw >= 1000 && (
              <button onClick={() => setModal(true)} className="btn btn-primary btn-lg" style={{ marginTop: '1.25rem' }}>
                💸 Withdraw Now
              </button>
            )}
            {revenue.available_to_withdraw < 1000 && (
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Minimum withdrawal is RF 1,000
              </div>
            )}
          </div>

          {/* Breakdown grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Deposited', value: revenue.total_deposited, color: '#22c55e', icon: '📥', desc: 'All approved deposits' },
              { label: 'Paid to Winners', value: revenue.total_paid_out, color: '#ef4444', icon: '🏆', desc: 'Won bets paid out' },
              { label: 'User Withdrawals', value: revenue.total_user_withdrawals, color: '#f59e0b', icon: '💸', desc: 'Approved withdrawals' },
              { label: 'Refunds', value: revenue.total_refunded, color: '#8b5cf6', icon: '↩️', desc: 'Cancelled bet refunds' },
              { label: 'Gross Revenue', value: revenue.gross_revenue, color: '#06b6d4', icon: '📊', desc: 'Before admin withdrawals' },
              { label: 'Admin Withdrawn', value: revenue.admin_withdrawn, color: '#64748b', icon: '🏦', desc: 'Already withdrawn' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>RF {fmt(s.value)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Revenue formula */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>📐 Revenue Calculation</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 2, fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--success)' }}>RF {fmt(revenue.total_deposited)}</span> (deposits)
              {' − '}
              <span style={{ color: 'var(--danger)' }}>RF {fmt(revenue.total_paid_out)}</span> (winnings)
              {' − '}
              <span style={{ color: 'var(--warning)' }}>RF {fmt(revenue.total_user_withdrawals)}</span> (withdrawals)
              {' − '}
              <span style={{ color: '#8b5cf6' }}>RF {fmt(revenue.total_refunded)}</span> (refunds)
              {' − '}
              <span style={{ color: '#64748b' }}>RF {fmt(revenue.admin_withdrawn)}</span> (admin withdrawn)
              {' = '}
              <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>RF {fmt(revenue.available_to_withdraw)}</strong>
            </div>
          </div>
        </>
      )}

      {/* Withdrawal history */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Withdrawal History</h3>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No withdrawals yet</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Amount (RWF)</th>
                  <th>Sent To</th>
                  <th>Note</th>
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{h.reference}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>RF {fmt(h.amount)}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--info)', fontSize: '0.875rem' }}>{h.receiving_number}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h.note || '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>{h.admin_name}</td>
                    <td>
                      <span className={`badge ${h.status === 'completed' ? 'badge-success' : h.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(h.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {modal && revenue && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💸 Withdraw Revenue</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>

            {/* Receiving number highlight */}
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Money will be sent to</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>{RECEIVING_NUMBER}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>MTN MoMo Rwanda</div>
            </div>

            <div style={{ background: 'var(--bg-dark)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Available</span>
              <strong style={{ color: 'var(--success)' }}>RF {fmt(revenue.available_to_withdraw)}</strong>
            </div>

            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label className="form-label">Amount (RWF) *</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--primary)', color: '#000', borderRadius: '6px', padding: '0.2rem 0.6rem', fontWeight: 700, fontSize: '0.8rem', pointerEvents: 'none' }}>
                    🇷🇼 RF
                  </div>
                  <input
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '5rem', fontSize: '1.25rem', fontWeight: 600 }}
                    placeholder="e.g. 50000"
                    min="1000"
                    max={revenue.available_to_withdraw}
                    step="1"
                    value={form.amount}
                    onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                {/* Quick amounts */}
                {quickAmounts.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {quickAmounts.map((amt, i) => (
                      <button key={i} type="button"
                        onClick={() => setForm(prev => ({ ...prev, amount: amt.toString() }))}
                        style={{ padding: '0.375rem 0.875rem', borderRadius: '999px', border: '1px solid', borderColor: form.amount === amt.toString() ? 'var(--primary)' : 'var(--border)', background: form.amount === amt.toString() ? 'rgba(245,158,11,0.1)' : 'transparent', color: form.amount === amt.toString() ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                        {i === 0 ? '25%' : i === 1 ? '50%' : i === 2 ? '75%' : '100%'} · RF {fmt(amt)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Note <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <input className="form-input" placeholder="e.g. Monthly revenue withdrawal"
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} />
              </div>

              <div className="alert alert-warning" style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                ⚠️ This will record a withdrawal of <strong>RF {form.amount ? fmt(parseFloat(form.amount)) : '...'}</strong> sent to <strong>{RECEIVING_NUMBER}</strong>. Make sure you actually send the money via MTN MoMo.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={withdrawing}>
                  {withdrawing ? 'Processing...' : `Withdraw RF ${form.amount ? fmt(parseFloat(form.amount) || 0) : '...'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
