import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';

const typeIcon = { deposit: '💳', withdrawal: '💸', bet: '🎯', event: '📅', system: '🔔', bonus: '🎁' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=50');
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {}
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">🔔 Notifications</h1>
            {unread > 0 && <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-secondary btn-sm">Mark all read</button>
          )}
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-title">No notifications</div>
            <div className="empty-state-text">You're all caught up!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  background: n.is_read ? 'var(--bg-card)' : 'rgba(245,158,11,0.05)',
                  border: `1px solid ${n.is_read ? 'var(--border)' : 'rgba(245,158,11,0.3)'}`,
                  borderRadius: '10px', padding: '1rem',
                  display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.is_read ? 500 : 700, marginBottom: '0.25rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
