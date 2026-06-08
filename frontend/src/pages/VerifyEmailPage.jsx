import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed'); });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}>
        {status === 'loading' && <><div className="spinner" style={{ margin: '0 auto 1rem' }} /><p>Verifying your email...</p></>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
            <Link to="/login" className="btn btn-primary btn-full">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
            <Link to="/login" className="btn btn-primary btn-full">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
