import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, status]);

  const toggleStatus = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle-status`);
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">👥 Manage Users</h1>
        <p className="page-subtitle">{total} total users</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '2.75rem' }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[['', 'All'], ['active', 'Active'], ['suspended', 'Suspended']].map(([val, label]) => (
              <button key={val} onClick={() => setStatus(val)} className={`btn btn-sm ${status === val ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Balance</th>
                  <th>Deposited</th>
                  <th>Winnings</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{user.email}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>${parseFloat(user.balance || 0).toFixed(2)}</td>
                    <td>${parseFloat(user.total_deposited || 0).toFixed(2)}</td>
                    <td style={{ color: 'var(--success)' }}>${parseFloat(user.total_winnings || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => toggleStatus(user.id)}
                          className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                        >
                          {user.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button onClick={() => deleteUser(user.id, user.username)} className="btn btn-sm btn-danger">Del</button>
                      </div>
                    </td>
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
