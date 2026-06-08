import React, { useState, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCamera, FiUser, FiLock, FiCopy } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth?.split('T')[0] || '',
    country: user?.country || '',
  });
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', profileForm);
      if (data.success) {
        toast.success('Profile updated!');
        updateUser({ ...user, ...profileForm });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { data } = await api.put('/users/change-password', passForm);
      if (data.success) {
        toast.success('Password changed!');
        setPassForm({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploading(true);
    try {
      const { data } = await api.post('/users/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) {
        toast.success('Photo updated!');
        updateUser({ ...user, profile_photo: data.photo });
      }
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(user?.referral_code || '');
    toast.success('Referral code copied!');
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '700px' }}>
        <div className="page-header">
          <h1 className="page-title">⚙️ Profile Settings</h1>
        </div>

        {/* Avatar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-dark)', border: '3px solid var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.profile_photo
                ? <img src={`http://localhost:5000/${user.profile_photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <FiUser size={32} color="var(--text-muted)" />
              }
            </div>
            <button
              onClick={() => fileRef.current.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FiCamera size={14} color="#000" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.full_name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>@{user?.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Referral: </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '0.875rem' }}>{user?.referral_code}</span>
              <button onClick={copyReferral} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiCopy size={14} /></button>
            </div>
            {!user?.is_verified && (
              <span className="badge badge-warning" style={{ marginTop: '0.5rem' }}>Email not verified</span>
            )}
            {user?.is_verified && (
              <span className="badge badge-success" style={{ marginTop: '0.5rem' }}>✓ Verified</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setTab('profile')} className={`btn ${tab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}>
            <FiUser size={14} /> Profile Info
          </button>
          <button onClick={() => setTab('password')} className={`btn ${tab === 'password' ? 'btn-primary' : 'btn-secondary'}`}>
            <FiLock size={14} /> Change Password
          </button>
        </div>

        {tab === 'profile' && (
          <div className="card">
            <form onSubmit={handleProfileSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" value={user?.username} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" placeholder="+1234567890" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={profileForm.date_of_birth} onChange={e => setProfileForm({ ...profileForm, date_of_birth: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input className="form-input" placeholder="Your country" value={profileForm.country} onChange={e => setProfileForm({ ...profileForm, country: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {tab === 'password' && (
          <div className="card">
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={passForm.current_password} onChange={e => setPassForm({ ...passForm, current_password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Min 8 chars, uppercase, number" value={passForm.new_password} onChange={e => setPassForm({ ...passForm, new_password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={passForm.confirm_password} onChange={e => setPassForm({ ...passForm, confirm_password: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
