import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/leaderboard').then(({ data }) => {
      setLeaders(data.leaderboard || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-subtitle">Top winners on the platform</p>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : leaders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <div className="empty-state-title">No data yet</div>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {leaders.length >= 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
                {[leaders[1], leaders[0], leaders[2]].map((leader, i) => {
                  const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                  const heights = [120, 150, 100];
                  return (
                    <div key={leader.username} style={{ textAlign: 'center', flex: 1, maxWidth: '180px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{medals[rank - 1]}</div>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-dark)', border: `3px solid ${rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : '#cd7f32'}`, margin: '0 auto 0.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {leader.profile_photo ? <img src={`http://localhost:5000/${leader.profile_photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{leader.username}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 700 }}>${parseFloat(leader.total_winnings).toFixed(2)}</div>
                      <div style={{
                        height: heights[i], background: rank === 1 ? 'rgba(245,158,11,0.2)' : 'var(--bg-card)',
                        border: `1px solid ${rank === 1 ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                        borderRadius: '8px 8px 0 0', marginTop: '0.5rem',
                      }} />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Total Bets</th>
                    <th>Won</th>
                    <th>Total Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((leader, i) => (
                    <tr key={leader.username}>
                      <td>
                        <span style={{ fontWeight: 700, color: i < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {i < 3 ? medals[i] : `#${i + 1}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-dark)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            {leader.profile_photo ? <img src={`http://localhost:5000/${leader.profile_photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                          </div>
                          <span style={{ fontWeight: 600 }}>{leader.username}</span>
                        </div>
                      </td>
                      <td>{leader.total_bets || 0}</td>
                      <td style={{ color: 'var(--success)' }}>{leader.won_bets || 0}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(leader.total_winnings).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
