import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

const statusColor = { pending:'warning', won:'success', lost:'danger', cancelled:'secondary', partial:'warning' };
const fmt = (n) => Math.round(Number(n || 0)).toLocaleString();

export default function BetHistoryPage() {
  const [slips, setSlips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/betslip?${params}`);
      setSlips(data.slips || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlips(); }, [statusFilter, page]);

  useEffect(() => {
    api.get('/betslip/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredSlips = typeFilter
    ? slips.filter(s => s.slip_type === typeFilter)
    : slips;

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="page-header">
          <h1 className="page-title">📋 Bet History</h1>
          <p className="page-subtitle">All your singles and accumulators</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Bets',    value: stats.total || 0,        color: '#3b82f6', icon: '🎯' },
              { label: 'Won',           value: stats.won || 0,           color: '#22c55e', icon: '🏆' },
              { label: 'Lost',          value: stats.lost || 0,          color: '#ef4444', icon: '❌' },
              { label: 'Pending',       value: stats.pending || 0,       color: '#f59e0b', icon: '⏳' },
              { label: 'Accumulators',  value: stats.accumulators || 0,  color: '#8b5cf6', icon: '🎰' },
              { label: 'Total Staked',  value: `RF ${fmt(stats.total_staked)}`,  color: '#f59e0b', icon: '💰' },
              { label: 'Total Won',     value: `RF ${fmt(stats.total_won)}`,     color: '#22c55e', icon: '💵' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Status:</span>
              {[['', 'All'], ['pending', 'Pending'], ['won', 'Won'], ['lost', 'Lost'], ['cancelled', 'Cancelled']].map(([val, label]) => (
                <button key={val} onClick={() => { setStatusFilter(val); setPage(1); }}
                  className={`btn btn-sm ${statusFilter === val ? 'btn-primary' : 'btn-secondary'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginLeft: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Type:</span>
              {[['', 'All'], ['single', 'Singles'], ['accumulator', 'Accumulators']].map(([val, label]) => (
                <button key={val} onClick={() => setTypeFilter(val)}
                  className={`btn btn-sm ${typeFilter === val ? 'btn-primary' : 'btn-secondary'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bet slips list */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filteredSlips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No bets found</div>
            <a href="/betting" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Place a Bet</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filteredSlips.map(slip => {
              const isAccum = slip.slip_type === 'accumulator';
              const isExpanded = expanded[slip.id];
              return (
                <div key={slip.id} style={{
                  background: 'var(--bg-card)', border: `1px solid ${slip.status === 'won' ? 'rgba(34,197,94,0.3)' : slip.status === 'lost' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                  borderRadius: '12px', overflow: 'hidden',
                }}>
                  {/* Slip header */}
                  <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1.5rem' }}>{isAccum ? '🎰' : '🎯'}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {isAccum ? `Accumulator · ${slip.legs?.length || 0} legs` : 'Single Bet'}
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                            @ {parseFloat(slip.total_odds).toFixed(2)}x
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(slip.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stake</div>
                        <div style={{ fontWeight: 700 }}>RF {fmt(slip.total_stake)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {slip.status === 'won' ? 'Won' : 'Potential'}
                        </div>
                        <div style={{ fontWeight: 700, color: slip.status === 'won' ? 'var(--success)' : 'var(--text-primary)' }}>
                          RF {fmt(slip.status === 'won' ? slip.actual_winnings : slip.potential_winnings)}
                        </div>
                      </div>
                      <span className={`badge badge-${statusColor[slip.status]}`} style={{ fontSize: '0.8rem' }}>
                        {slip.status}
                      </span>
                      {isAccum && (
                        <button onClick={() => toggleExpand(slip.id)}
                          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.625rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                          {isExpanded ? '▲ Hide' : '▼ Show legs'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Single bet leg (always shown) */}
                  {!isAccum && slip.legs?.[0] && (
                    <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                      <LegRow leg={slip.legs[0]} />
                    </div>
                  )}

                  {/* Accumulator legs (expandable) */}
                  {isAccum && isExpanded && slip.legs && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {slip.legs.map((leg, i) => (
                        <div key={leg.id} style={{ padding: '0.75rem 1rem', borderBottom: i < slip.legs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <LegRow leg={leg} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="pagination" style={{ marginTop: '1.5rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }, (_, i) => {
              const p = Math.max(1, page - 2) + i;
              return p <= Math.ceil(total / limit) ? (
                <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>{p}</button>
              ) : null;
            })}
            <button onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))} disabled={page === Math.ceil(total / limit)}>→</button>
          </div>
        )}
      </div>
    </>
  );
}

function LegRow({ leg }) {
  const statusColor = { pending:'warning', won:'success', lost:'danger', cancelled:'secondary' };
  const selLabel = leg.selection === 'team_a' ? leg.team_a : leg.selection === 'team_b' ? leg.team_b : 'Draw';
  const isLive = leg.event_status === 'live';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{leg.league}</div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {leg.team_a} vs {leg.team_b}
          {isLive && leg.event_status === 'live' && (
            <span style={{ marginLeft: '0.5rem', background: 'var(--danger)', color: '#fff', borderRadius: '3px', padding: '0.1rem 0.375rem', fontSize: '0.65rem', fontWeight: 700 }}>
              LIVE {leg.elapsed ? `${leg.elapsed}'` : ''}
            </span>
          )}
        </div>
        {isLive && leg.score_a !== null && (
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.2rem' }}>
            Score: {leg.score_a} - {leg.score_b}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
          Pick: <strong>{selLabel}</strong> @ {parseFloat(leg.odds).toFixed(2)}x
        </div>
      </div>
      <span className={`badge badge-${statusColor[leg.status]}`}>{leg.status}</span>
    </div>
  );
}
