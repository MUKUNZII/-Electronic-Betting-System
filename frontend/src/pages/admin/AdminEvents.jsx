import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const categories = ['Football','Basketball','Tennis','Cricket','Baseball','Hockey','Boxing','MMA','Rugby','Golf','Other'];
const emptyForm = { title: '', category: 'Football', team_a: '', team_b: '', odds_a: '1.50', odds_b: '1.50', odds_draw: '', start_time: '', end_time: '', description: '', status: 'upcoming' };

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'result'
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [result, setResult] = useState('team_a');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/events?${params}`);
      setEvents(data.events || []);
    } catch (err) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [statusFilter]);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('create'); };
  const openEdit = (event) => {
    setForm({
      title: event.title, category: event.category, team_a: event.team_a, team_b: event.team_b,
      odds_a: event.odds_a, odds_b: event.odds_b, odds_draw: event.odds_draw || '',
      start_time: event.start_time?.slice(0, 16), end_time: event.end_time?.slice(0, 16),
      description: event.description || '', status: event.status,
    });
    setEditId(event.id);
    setModal('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/events/${editId}`, form);
        toast.success('Event updated!');
      } else {
        await api.post('/admin/events', form);
        toast.success('Event created!');
      }
      setModal(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleSetResult = async () => {
    try {
      const { data } = await api.put(`/admin/events/${resultModal.id}/result`, { result });
      if (data.success) { toast.success(data.message); setResultModal(null); fetchEvents(); }
    } catch (err) {
      toast.error('Failed to set result');
    }
  };

  const statusColor = { upcoming: 'info', live: 'danger', closed: 'secondary', completed: 'success', cancelled: 'secondary' };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">📅 Manage Events</h1>
          <p className="page-subtitle">Create and manage betting events</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">+ Create Event</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['', 'All'], ['upcoming', 'Upcoming'], ['live', 'Live'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)} className={`btn btn-sm ${statusFilter === val ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No events found</div>
            <button onClick={openCreate} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Create First Event</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Teams</th>
                  <th>Odds</th>
                  <th>Start Time</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</td>
                    <td><span className="badge badge-info">{event.category}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <div>{event.team_a}</div>
                      <div style={{ color: 'var(--text-muted)' }}>vs {event.team_b}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--primary)' }}>{event.team_a}: {parseFloat(event.odds_a).toFixed(2)}</div>
                      <div style={{ color: 'var(--primary)' }}>{event.team_b}: {parseFloat(event.odds_b).toFixed(2)}</div>
                      {event.odds_draw && <div style={{ color: 'var(--text-muted)' }}>Draw: {parseFloat(event.odds_draw).toFixed(2)}</div>}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(event.start_time).toLocaleString()}</td>
                    <td><span className={`badge badge-${statusColor[event.status]}`}>{event.status}</span></td>
                    <td style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{event.result?.replace('_', ' ') || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <button onClick={() => openEdit(event)} className="btn btn-sm btn-secondary">Edit</button>
                        {(event.status === 'live' || event.status === 'closed') && (
                          <button onClick={() => { setResultModal(event); setResult('team_a'); }} className="btn btn-sm btn-primary">Result</button>
                        )}
                        <button onClick={() => handleDelete(event.id)} className="btn btn-sm btn-danger">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'create' ? 'Create Event' : 'Edit Event'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input className="form-input" placeholder="e.g. Manchester United vs Arsenal" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['upcoming','live','closed','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Team A *</label>
                  <input className="form-input" placeholder="Home team" value={form.team_a} onChange={e => setForm({ ...form, team_a: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Team B *</label>
                  <input className="form-input" placeholder="Away team" value={form.team_b} onChange={e => setForm({ ...form, team_b: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Odds A *</label>
                  <input type="number" step="0.01" min="1.01" className="form-input" value={form.odds_a} onChange={e => setForm({ ...form, odds_a: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Odds B *</label>
                  <input type="number" step="0.01" min="1.01" className="form-input" value={form.odds_b} onChange={e => setForm({ ...form, odds_b: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Draw Odds</label>
                  <input type="number" step="0.01" min="1.01" className="form-input" placeholder="Optional" value={form.odds_draw} onChange={e => setForm({ ...form, odds_draw: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{modal === 'create' ? 'Create Event' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="modal-overlay" onClick={() => setResultModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Set Event Result</h3>
              <button className="modal-close" onClick={() => setResultModal(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>{resultModal.title}</p>
            <div className="form-group">
              <label className="form-label">Select Result</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { val: 'team_a', label: `${resultModal.team_a} Wins` },
                  { val: 'team_b', label: `${resultModal.team_b} Wins` },
                  ...(resultModal.odds_draw ? [{ val: 'draw', label: 'Draw' }] : []),
                  { val: 'cancelled', label: 'Cancelled (Refund all bets)' },
                ].map(opt => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: `2px solid ${result === opt.val ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', background: result === opt.val ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
                    <input type="radio" value={opt.val} checked={result === opt.val} onChange={() => setResult(opt.val)} style={{ accentColor: 'var(--primary)' }} />
                    <span style={{ fontWeight: result === opt.val ? 600 : 400 }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="alert alert-warning">⚠️ This will settle all pending bets for this event. This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setResultModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSetResult} className="btn btn-primary" style={{ flex: 1 }}>Set Result & Settle Bets</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
