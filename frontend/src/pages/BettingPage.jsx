import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiRefreshCw, FiTrash2, FiChevronRight, FiChevronDown, FiBookmark, FiShare2 } from 'react-icons/fi';

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString();
const SPORT_ICONS = { Football:'⚽',Basketball:'🏀',Tennis:'🎾',Cricket:'🏏',MMA:'🥋',Boxing:'🥊',Rugby:'🏉',Golf:'⛳',Other:'🎮' };

// Markets available per event type
const MARKETS = [
  { id: '1x2',    label: '1X2',          desc: 'Match Result' },
  { id: 'dc',     label: 'Double Chance', desc: '1X · X2 · 12' },
];

// Selection label mapping
const SEL_LABEL = {
  team_a: '1', draw: 'X', team_b: '2',
  '1x': '1X', 'x2': 'X2', '12': '12',
};

const SEL_NAME = (sel, team_a, team_b) => ({
  team_a: team_a, draw: 'Draw', team_b: team_b,
  '1x': `${team_a} or Draw`, 'x2': `Draw or ${team_b}`, '12': `${team_a} or ${team_b}`,
}[sel] || sel);

// In-memory cache
const cache = { data: null, ts: 0, key: '' };
const CACHE_TTL = 60000;

// ── Memoized odds button ──────────────────────────────────────────────────────
const OddsBtn = memo(({ label, sublabel, odds, selected, disabled, onClick }) => (
  <button onClick={onClick} disabled={disabled || !odds}
    style={{
      minHeight: 44, borderRadius: 6, border: '1px solid',
      borderColor: selected ? '#f59e0b' : disabled ? '#0d1117' : '#1e2a3a',
      background: selected ? 'rgba(245,158,11,0.18)' : disabled ? '#0d1117' : '#111827',
      color: selected ? '#f59e0b' : disabled ? '#1e2a3a' : '#94a3b8',
      fontWeight: selected ? 700 : 500, fontSize: '0.82rem',
      cursor: disabled || !odds ? 'default' : 'pointer',
      transition: 'all 0.1s', padding: '4px 2px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
    }}>
    <span style={{ fontSize: '0.6rem', color: selected ? '#f59e0b' : '#4b5563' }}>{label}</span>
    <span>{odds ? parseFloat(odds).toFixed(2) : '-'}</span>
    {sublabel && <span style={{ fontSize: '0.58rem', color: selected ? '#f59e0b' : '#374151', lineHeight: 1 }}>{sublabel}</span>}
  </button>
));

// ── Match row ─────────────────────────────────────────────────────────────────
const MatchRow = memo(({ event, sel, market, onSelect }) => {
  const isLive = event.status === 'live';
  const hasScore = isLive && event.score_a !== null;
  const show1x2 = market === '1x2';
  const showDC  = market === 'dc';

  return (
    <div style={{ borderBottom: '1px solid #131d2b', background: sel ? 'rgba(245,158,11,0.02)' : 'transparent' }}>
      <div style={{ display: 'grid', gridTemplateColumns: show1x2 ? '1fr 68px 68px 68px' : '1fr 80px 80px 80px', gap: 5, padding: '0.55rem 1rem', alignItems: 'center' }}>
        {/* Match info */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            {isLive
              ? <span style={{ background:'#ef4444', color:'#fff', borderRadius:3, padding:'0.1rem 0.35rem', fontSize:'0.6rem', fontWeight:700 }}>{event.elapsed ? `${event.elapsed}'` : 'LIVE'}</span>
              : <span style={{ fontSize:'0.65rem', color:'#4b5563' }}>{new Date(event.start_time).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
            }
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            {event.team_a_logo && <img src={event.team_a_logo} alt="" width={14} height={14} style={{objectFit:'contain',flexShrink:0}} loading="lazy" onError={e=>e.target.style.display='none'} />}
            <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event.team_a}</span>
            {hasScore && <span style={{ fontWeight:700, color:'#f59e0b', fontSize:'0.82rem', flexShrink:0 }}>{event.score_a}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
            {event.team_b_logo && <img src={event.team_b_logo} alt="" width={14} height={14} style={{objectFit:'contain',flexShrink:0}} loading="lazy" onError={e=>e.target.style.display='none'} />}
            <span style={{ fontSize:'0.82rem', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event.team_b}</span>
            {hasScore && <span style={{ fontWeight:700, color:'#f59e0b', fontSize:'0.82rem', flexShrink:0 }}>{event.score_b}</span>}
          </div>
        </div>
        {/* 1X2 odds */}
        {show1x2 && <>
          <OddsBtn label="1" odds={event.odds_a}    selected={sel==='team_a'} onClick={()=>onSelect(event,'team_a')} />
          <OddsBtn label="X" odds={event.odds_draw} selected={sel==='draw'}   onClick={()=>event.odds_draw&&onSelect(event,'draw')} disabled={!event.odds_draw} />
          <OddsBtn label="2" odds={event.odds_b}    selected={sel==='team_b'} onClick={()=>onSelect(event,'team_b')} />
        </>}
        {/* Double Chance odds */}
        {showDC && <>
          <OddsBtn label="1X" sublabel="Home/Draw" odds={event.odds_1x} selected={sel==='1x'} onClick={()=>event.odds_1x&&onSelect(event,'1x')} disabled={!event.odds_1x} />
          <OddsBtn label="X2" sublabel="Draw/Away" odds={event.odds_x2} selected={sel==='x2'} onClick={()=>event.odds_x2&&onSelect(event,'x2')} disabled={!event.odds_x2} />
          <OddsBtn label="12" sublabel="Home/Away" odds={event.odds_12} selected={sel==='12'} onClick={()=>event.odds_12&&onSelect(event,'12')} disabled={!event.odds_12} />
        </>}
      </div>
    </div>
  );
});

// ── Booking Code Modal ────────────────────────────────────────────────────────
function BookingModal({ code, legs, totalOdds, onClose, onLoad }) {
  const [loadCode, setLoadCode] = useState('');
  const [loadLoading, setLoadLoading] = useState(false);
  const shareUrl = `${window.location.origin}/betting?book=${code}`;

  const copyCode = () => { navigator.clipboard.writeText(code); toast.success('Code copied!'); };
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); };

  const handleLoad = async () => {
    if (!loadCode.trim()) return;
    setLoadLoading(true);
    try {
      const { data } = await api.get(`/booking/${loadCode.trim().toUpperCase()}`);
      if (data.success) {
        onLoad(data.booking);
        onClose();
        toast.success(`Loaded ${data.booking.leg_count} selections from code ${data.booking.code}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code not found');
    } finally { setLoadLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }} onClick={onClose}>
      <div style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:14, padding:'1.5rem', width:'100%', maxWidth:420 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <h3 style={{ fontWeight:700, color:'#e2e8f0', fontSize:'1rem' }}>🔖 Booking Code</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:'1.25rem' }}>×</button>
        </div>

        {code ? (
          <>
            <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'0.75rem', color:'#6b7280', marginBottom:'0.5rem' }}>Your booking code</div>
              <div style={{ fontSize:'2.5rem', fontWeight:900, color:'#f59e0b', letterSpacing:'0.15em', fontFamily:'monospace', background:'#111827', borderRadius:10, padding:'0.75rem 1.5rem', display:'inline-block' }}>{code}</div>
              <div style={{ fontSize:'0.75rem', color:'#4b5563', marginTop:'0.5rem' }}>{legs} selections · {totalOdds.toFixed(2)}x combined odds · Valid 7 days</div>
            </div>
            <div style={{ display:'flex', gap:'0.625rem', marginBottom:'1rem' }}>
              <button onClick={copyCode} style={{ flex:1, padding:'0.625rem', borderRadius:8, border:'1px solid #1e2a3a', background:'#111827', color:'#e2e8f0', cursor:'pointer', fontWeight:600, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <FiBookmark size={14}/> Copy Code
              </button>
              <button onClick={copyLink} style={{ flex:1, padding:'0.625rem', borderRadius:8, border:'1px solid #1e2a3a', background:'#111827', color:'#e2e8f0', cursor:'pointer', fontWeight:600, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <FiShare2 size={14}/> Share Link
              </button>
            </div>
            <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'0.75rem', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.6 }}>
              Share this code with friends. They can enter it on the betting page to load the same selections and place their own bet.
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.78rem', color:'#6b7280', display:'block', marginBottom:'0.375rem' }}>Enter a booking code to load selections</label>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <input
                  style={{ flex:1, padding:'0.625rem 0.875rem', background:'#111827', border:'1px solid #1e2a3a', borderRadius:8, color:'#fff', fontSize:'1rem', fontWeight:700, outline:'none', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace' }}
                  placeholder="e.g. ABC123"
                  value={loadCode}
                  onChange={e => setLoadCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleLoad()}
                />
                <button onClick={handleLoad} disabled={loadLoading || loadCode.length < 4}
                  style={{ padding:'0.625rem 1rem', borderRadius:8, border:'none', background: loadLoading?'#374151':'#f59e0b', color: loadLoading?'#6b7280':'#000', fontWeight:700, cursor: loadLoading?'not-allowed':'pointer', fontSize:'0.85rem' }}>
                  {loadLoading ? '...' : 'Load'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Bet Slip ──────────────────────────────────────────────────────────────────
const BetSlip = memo(({ slip, setSlip, wallet, onPlace, placing, onBook, onLoadCode }) => {
  const totalOdds = slip.legs.reduce((a, l) => a * l.odds, 1);
  const potWin = slip.stake ? Math.round(parseFloat(slip.stake) * totalOdds) : 0;
  const isAccum = slip.legs.length > 1;
  const stakeNum = parseFloat(slip.stake) || 0;
  const belowMin = stakeNum > 0 && stakeNum < 100;

  const remove = (id) => setSlip(p => ({ ...p, legs: p.legs.filter(l => l.event_id !== id) }));

  return (
    <div style={{ width:290, flexShrink:0, background:'#0d1117', borderLeft:'1px solid #1e2a3a', display:'flex', flexDirection:'column', height:'calc(100vh - 64px)', position:'sticky', top:64 }}>
      {/* Header */}
      <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #1e2a3a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:700, color:'#fff', fontSize:'0.9rem' }}>
          🎯 Bet Slip {slip.legs.length > 0 && <span style={{ background:'#f59e0b', color:'#000', borderRadius:999, padding:'0.1rem 0.45rem', fontSize:'0.68rem', marginLeft:6 }}>{slip.legs.length}</span>}
        </span>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={onLoadCode} title="Load booking code" style={{ background:'none', border:'1px solid #1e2a3a', borderRadius:5, padding:'0.25rem 0.5rem', color:'#6b7280', cursor:'pointer', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:3 }}>
            <FiBookmark size={11}/> Load
          </button>
          {slip.legs.length > 0 && <button onClick={() => setSlip({ legs:[], stake:'' })} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:3 }}><FiTrash2 size={11}/> Clear</button>}
        </div>
      </div>
      {slip.legs.length > 0 && (
        <div style={{ padding:'0.375rem 1rem', background:'#111827', borderBottom:'1px solid #1e2a3a' }}>
          <span style={{ fontSize:'0.7rem', fontWeight:600, color: isAccum?'#f59e0b':'#6b7280' }}>
            {isAccum ? `🎰 ACCUMULATOR · ${slip.legs.length} LEGS` : '🎯 SINGLE'}
          </span>
        </div>
      )}
      {/* Legs */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {slip.legs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem 1rem', color:'#374151' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎯</div>
            <div style={{ color:'#6b7280', fontWeight:600, marginBottom:'0.5rem' }}>Slip is empty</div>
            <div style={{ fontSize:'0.78rem', color:'#4b5563', lineHeight:1.5 }}>Click 1, X, 2, 1X, X2 or 12 on any match</div>
          </div>
        ) : slip.legs.map(leg => (
          <div key={leg.event_id} style={{ padding:'0.75rem 1rem', borderBottom:'1px solid #131d2b' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1, paddingRight:'0.5rem' }}>
                <div style={{ fontSize:'0.65rem', color:'#4b5563', marginBottom:'0.2rem', textTransform:'uppercase' }}>{leg.league}</div>
                <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#e2e8f0', lineHeight:1.3, marginBottom:'0.3rem' }}>{leg.team_a} vs {leg.team_b}</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#1e2a3a', borderRadius:4, padding:'0.15rem 0.45rem' }}>
                  <span style={{ fontSize:'0.65rem', color:'#6b7280' }}>{SEL_LABEL[leg.selection]}</span>
                  <span style={{ fontSize:'0.72rem', color:'#e2e8f0' }}>{SEL_NAME(leg.selection, leg.team_a, leg.team_b)}</span>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <button onClick={() => remove(leg.event_id)} style={{ background:'none', border:'none', color:'#374151', cursor:'pointer', fontSize:'1rem', lineHeight:1 }}>×</button>
                <span style={{ fontWeight:700, color:'#f59e0b', fontSize:'0.95rem' }}>{leg.odds.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      {slip.legs.length > 0 && (
        <div style={{ padding:'0.875rem', borderTop:'1px solid #1e2a3a' }}>
          {isAccum && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0.75rem', background:'#111827', borderRadius:6, marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'0.78rem', color:'#6b7280' }}>Combined Odds</span>
              <span style={{ fontWeight:700, color:'#f59e0b' }}>{totalOdds.toFixed(2)}x</span>
            </div>
          )}
          <label style={{ fontSize:'0.72rem', color:'#6b7280', display:'block', marginBottom:'0.375rem' }}>Stake (RWF) · Min RF 100</label>
          <div style={{ position:'relative', marginBottom:'0.5rem' }}>
            <span style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', fontSize:'0.72rem', fontWeight:700, color:'#f59e0b', pointerEvents:'none' }}>RF</span>
            <input type="number" min="100" step="100" placeholder="Enter stake"
              value={slip.stake} onChange={e => setSlip(p => ({ ...p, stake: e.target.value }))}
              style={{ width:'100%', padding:'0.625rem 0.75rem 0.625rem 2.25rem', background: belowMin?'rgba(239,68,68,0.08)':'#111827', border:`1px solid ${belowMin?'#ef4444':'#1e2a3a'}`, borderRadius:6, color:'#fff', fontSize:'0.95rem', fontWeight:600, outline:'none', boxSizing:'border-box' }} />
          </div>
          {belowMin && <div style={{ fontSize:'0.72rem', color:'#ef4444', marginBottom:'0.5rem' }}>⚠️ Minimum stake is RF 100</div>}
          <div style={{ display:'flex', gap:4, marginBottom:'0.75rem', flexWrap:'wrap' }}>
            {[500,1000,2000,5000].map(a => (
              <button key={a} onClick={() => setSlip(p => ({ ...p, stake: a.toString() }))}
                style={{ padding:'0.2rem 0.5rem', borderRadius:4, border:'1px solid', borderColor: slip.stake===a.toString()?'#f59e0b':'#1e2a3a', background: slip.stake===a.toString()?'rgba(245,158,11,0.15)':'#111827', color: slip.stake===a.toString()?'#f59e0b':'#4b5563', fontSize:'0.7rem', cursor:'pointer' }}>
                {fmt(a)}
              </button>
            ))}
          </div>
          {stakeNum >= 100 && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0.75rem', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:6, marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'0.78rem', color:'#6b7280' }}>Potential Win</span>
              <span style={{ fontWeight:700, color:'#22c55e' }}>RF {fmt(potWin)}</span>
            </div>
          )}
          {/* Book code button */}
          <button onClick={onBook} style={{ width:'100%', padding:'0.55rem', borderRadius:7, border:'1px solid #1e2a3a', background:'#111827', color:'#94a3b8', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', marginBottom:'0.5rem', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <FiBookmark size={13}/> Book Code (share without betting)
          </button>
          <button onClick={onPlace} disabled={placing || stakeNum < 100}
            style={{ width:'100%', padding:'0.75rem', borderRadius:8, border:'none', background: (placing||stakeNum<100)?'#1e2a3a':'#f59e0b', color: (placing||stakeNum<100)?'#4b5563':'#000', fontWeight:700, fontSize:'0.9rem', cursor: (placing||stakeNum<100)?'not-allowed':'pointer' }}>
            {placing ? 'Placing...' : isAccum ? `Place Accumulator (${slip.legs.length})` : 'Place Bet'}
          </button>
        </div>
      )}
    </div>
  );
});

// ── Main BettingPage ──────────────────────────────────────────────────────────
export default function BettingPage() {
  const [events, setEvents] = useState(() => cache.data || []);
  const [loading, setLoading] = useState(!cache.data);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState('Football');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [statusTab, setStatusTab] = useState(() => {
    // Check if we were navigated here with a specific tab preference
    const saved = sessionStorage.getItem('betting_tab');
    if (saved) { sessionStorage.removeItem('betting_tab'); return saved; }
    return 'upcoming';
  });
  const [market, setMarket] = useState('1x2');
  const [wallet, setWallet] = useState(null);
  const [slip, setSlip] = useState({ legs: [], stake: '' });
  const [placing, setPlacing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [bookingModal, setBookingModal] = useState(null); // null | { code, legs, totalOdds } | 'load'

  // Check URL for booking code on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookCode = params.get('book');
    if (bookCode) setBookingModal('load');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchEvents = useCallback(async (silent = false) => {
    const cacheKey = `${statusTab}|${debouncedSearch}`;
    const now = Date.now();
    if (!silent && cache.data && cache.key === cacheKey && now - cache.ts < CACHE_TTL) {
      setEvents(cache.data); setLoading(false); return;
    }
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (statusTab !== 'all') params.append('status', statusTab);
      if (debouncedSearch) params.append('search', debouncedSearch);
      const [evRes] = await Promise.all([
        api.get(`/events?${params}`),
        api.get('/wallet').then(({ data }) => setWallet(data.wallet)).catch(() => {}),
      ]);
      const evData = evRes.data.events || [];
      cache.data = evData; cache.ts = Date.now(); cache.key = cacheKey;
      setEvents(evData); setLastUpdated(new Date());
    } catch (err) { console.error(err); }
    finally { if (!silent) setLoading(false); }
  }, [statusTab, debouncedSearch]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => {
    if (statusTab !== 'live') return;
    const t = setInterval(() => fetchEvents(true), 45000);
    return () => clearInterval(t);
  }, [statusTab, fetchEvents]);

  const sports = useMemo(() => {
    const s = [...new Set(events.map(e => e.category))].filter(Boolean).sort();
    return s.includes('Football') ? ['Football', ...s.filter(x => x !== 'Football')] : s;
  }, [events]);

  const sportEvents = useMemo(() => events.filter(e => e.category === selectedSport), [events, selectedSport]);

  const leagueGroups = useMemo(() => {
    const g = {};
    sportEvents.forEach(e => { const k = e.league || e.category; if (!g[k]) g[k] = []; g[k].push(e); });
    return g;
  }, [sportEvents]);

  const displayGroups = useMemo(() =>
    selectedLeague === 'All' ? leagueGroups : { [selectedLeague]: leagueGroups[selectedLeague] || [] },
    [leagueGroups, selectedLeague]
  );

  const getLegSel = useCallback((id) => slip.legs.find(l => l.event_id === id)?.selection, [slip.legs]);

  const toggleSel = useCallback((event, selection) => {
    const oddsMap = { team_a: event.odds_a, team_b: event.odds_b, draw: event.odds_draw, '1x': event.odds_1x, 'x2': event.odds_x2, '12': event.odds_12 };
    const odds = parseFloat(oddsMap[selection]);
    if (!odds) return;
    setSlip(prev => {
      const existing = prev.legs.find(l => l.event_id === event.id);
      if (existing?.selection === selection) return { ...prev, legs: prev.legs.filter(l => l.event_id !== event.id) };
      const filtered = prev.legs.filter(l => l.event_id !== event.id);
      return { ...prev, legs: [...filtered, { event_id: event.id, event_title: event.title, team_a: event.team_a, team_b: event.team_b, league: event.league || event.category, selection, odds }] };
    });
  }, []);

  const handlePlace = async () => {
    if (!slip.stake || parseFloat(slip.stake) < 100) { toast.error('Minimum stake is RF 100'); return; }
    setPlacing(true);
    try {
      const { data } = await api.post('/betslip', {
        legs: slip.legs.map(l => ({ event_id: l.event_id, selection: l.selection })),
        stake: parseFloat(slip.stake),
      });
      if (data.success) {
        toast.success(data.message);
        setSlip({ legs: [], stake: '' });
        api.get('/wallet').then(({ data }) => setWallet(data.wallet)).catch(() => {});
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to place bet'); }
    finally { setPlacing(false); }
  };

  const handleBook = async () => {
    if (slip.legs.length === 0) { toast.error('Add selections first'); return; }
    try {
      const { data } = await api.post('/booking', {
        legs: slip.legs.map(l => ({ event_id: l.event_id, selection: l.selection, odds: l.odds, team_a: l.team_a, team_b: l.team_b, league: l.league })),
      });
      if (data.success) {
        setBookingModal({ code: data.code, legs: data.leg_count, totalOdds: data.total_odds });
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create booking code'); }
  };

  const handleLoadBooking = (booking) => {
    const newLegs = booking.legs.filter(l => l.available).map(l => ({
      event_id: l.event_id, event_title: l.event_title || `${l.team_a} vs ${l.team_b}`,
      team_a: l.team_a, team_b: l.team_b, league: l.league, selection: l.selection, odds: parseFloat(l.odds),
    }));
    setSlip(prev => ({ ...prev, legs: newLegs }));
  };

  return (
    <>
      <Navbar />
      <div style={{ display:'flex', minHeight:'calc(100vh - 64px)', background:'#0a0f1a' }}>
        {/* LEFT SIDEBAR */}
        <div style={{ width:185, flexShrink:0, background:'#0d1117', borderRight:'1px solid #1e2a3a', overflowY:'auto', height:'calc(100vh - 64px)', position:'sticky', top:64 }}>
          <div style={{ padding:'0.625rem' }}>
            <div style={{ position:'relative' }}>
              <FiSearch style={{ position:'absolute', left:'0.5rem', top:'50%', transform:'translateY(-50%)', color:'#4b5563', fontSize:'0.75rem' }} />
              <input style={{ width:'100%', padding:'0.45rem 0.5rem 0.45rem 1.75rem', background:'#111827', border:'1px solid #1e2a3a', borderRadius:6, color:'#e2e8f0', fontSize:'0.78rem', outline:'none', boxSizing:'border-box' }}
                placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div style={{ padding:'0 0.625rem 0.625rem' }}>
            {[['upcoming','📅 Upcoming'],['live','🔴 Live'],['all','📋 All']].map(([k,l]) => (
              <button key={k} onClick={() => setStatusTab(k)} style={{ display:'block', width:'100%', textAlign:'left', padding:'0.45rem 0.625rem', borderRadius:5, border:'none', marginBottom:2, background: statusTab===k?'rgba(245,158,11,0.15)':'transparent', color: statusTab===k?'#f59e0b':'#6b7280', fontSize:'0.78rem', fontWeight: statusTab===k?600:400, cursor:'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ height:1, background:'#1e2a3a', margin:'0 0.625rem 0.625rem' }} />
          {sports.map(sport => (
            <div key={sport}>
              <button onClick={() => { setSelectedSport(sport); setSelectedLeague('All'); }}
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', width:'100%', padding:'0.55rem 0.75rem', border:'none', background: selectedSport===sport?'rgba(245,158,11,0.1)':'transparent', color: selectedSport===sport?'#f59e0b':'#94a3b8', fontSize:'0.82rem', fontWeight: selectedSport===sport?600:400, cursor:'pointer', textAlign:'left', borderLeft: selectedSport===sport?'3px solid #f59e0b':'3px solid transparent' }}>
                <span>{SPORT_ICONS[sport]||'🎮'}</span>
                <span style={{ flex:1 }}>{sport}</span>
                <span style={{ fontSize:'0.65rem', background:'#1e2a3a', borderRadius:999, padding:'0.1rem 0.35rem', color:'#4b5563' }}>{events.filter(e=>e.category===sport).length}</span>
              </button>
              {selectedSport === sport && Object.keys(leagueGroups).map(lg => (
                <button key={lg} onClick={() => setSelectedLeague(lg)}
                  style={{ display:'flex', alignItems:'center', gap:4, width:'100%', padding:'0.4rem 0.75rem 0.4rem 2rem', border:'none', background: selectedLeague===lg?'rgba(245,158,11,0.07)':'transparent', color: selectedLeague===lg?'#f59e0b':'#6b7280', fontSize:'0.74rem', cursor:'pointer', textAlign:'left' }}>
                  <FiChevronRight size={9} />
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lg.split('·')[0].trim()}</span>
                  <span style={{ fontSize:'0.65rem', color:'#374151' }}>{leagueGroups[lg].length}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* MAIN */}
        <div style={{ flex:1, overflowY:'auto', minWidth:0 }}>
          {/* Topbar */}
          <div style={{ padding:'0.55rem 1rem', borderBottom:'1px solid #1e2a3a', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0d1117', position:'sticky', top:0, zIndex:10, flexWrap:'wrap', gap:'0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
              <span>{SPORT_ICONS[selectedSport]}</span>
              <span style={{ fontWeight:700, color:'#e2e8f0', fontSize:'0.9rem' }}>{selectedSport}</span>
              {selectedLeague !== 'All' && <span style={{ color:'#4b5563', fontSize:'0.75rem' }}>· {selectedLeague.split('·')[0].trim()}</span>}
              {statusTab === 'live' && <span style={{ background:'#ef4444', color:'#fff', borderRadius:3, padding:'0.1rem 0.4rem', fontSize:'0.62rem', fontWeight:700 }}>🔴 LIVE</span>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              {/* Market selector */}
              <div style={{ display:'flex', gap:3 }}>
                {MARKETS.map(m => (
                  <button key={m.id} onClick={() => setMarket(m.id)}
                    style={{ padding:'0.3rem 0.625rem', borderRadius:5, border:'1px solid', borderColor: market===m.id?'#f59e0b':'#1e2a3a', background: market===m.id?'rgba(245,158,11,0.15)':'#111827', color: market===m.id?'#f59e0b':'#6b7280', fontSize:'0.72rem', fontWeight: market===m.id?600:400, cursor:'pointer' }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { cache.ts = 0; fetchEvents(); }} style={{ background:'none', border:'1px solid #1e2a3a', borderRadius:5, padding:'0.3rem 0.5rem', color:'#4b5563', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontSize:'0.72rem' }}>
                <FiRefreshCw size={11} /> Refresh
              </button>
            </div>
          </div>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns: market==='1x2'?'1fr 68px 68px 68px':'1fr 80px 80px 80px', gap:5, padding:'0.4rem 1rem', background:'#111827', borderBottom:'1px solid #1e2a3a' }}>
            <span style={{ fontSize:'0.62rem', color:'#374151', textTransform:'uppercase', letterSpacing:'0.05em' }}>Match</span>
            {market === '1x2' ? ['1','X','2'].map(h => <span key={h} style={{ fontSize:'0.62rem', color:'#374151', textAlign:'center', textTransform:'uppercase' }}>{h}</span>)
              : ['1X','X2','12'].map(h => <span key={h} style={{ fontSize:'0.62rem', color:'#374151', textAlign:'center', textTransform:'uppercase' }}>{h}</span>)}
          </div>

          {loading ? (
            <div>
              {[1,2,3].map(g => (
                <div key={g}>
                  <div style={{ padding:'0.5rem 1rem', background:'#111827', borderBottom:'1px solid #1e2a3a' }}>
                    <div style={{ width:120, height:12, background:'#1e2a3a', borderRadius:4 }} />
                  </div>
                  {[1,2,3,4].map(r => (
                    <div key={r} style={{ display:'grid', gridTemplateColumns:'1fr 68px 68px 68px', gap:5, padding:'0.55rem 1rem', borderBottom:'1px solid #131d2b', alignItems:'center' }}>
                      <div><div style={{ width:'55%', height:11, background:'#1e2a3a', borderRadius:3, marginBottom:5 }} /><div style={{ width:'40%', height:10, background:'#131d2b', borderRadius:3 }} /></div>
                      {[1,2,3].map(b => <div key={b} style={{ height:40, background:'#1e2a3a', borderRadius:5 }} />)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : Object.keys(displayGroups).length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem', color:'#374151' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚽</div>
              <div style={{ color:'#6b7280', fontWeight:600 }}>No events found</div>
            </div>
          ) : (
            Object.entries(displayGroups).map(([league, lgEvents]) => (
              <div key={league}>
                <button onClick={() => setCollapsed(p => ({ ...p, [league]: !p[league] }))}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem 1rem', background:'#111827', border:'none', borderBottom:'1px solid #1e2a3a', cursor:'pointer', textAlign:'left' }}>
                  <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#94a3b8', flex:1 }}>🏆 {league}</span>
                  <span style={{ fontSize:'0.65rem', color:'#374151', marginRight:4 }}>{lgEvents.length}</span>
                  <FiChevronDown size={12} style={{ color:'#374151', transform: collapsed[league]?'rotate(-90deg)':'none', transition:'transform 0.2s' }} />
                </button>
                {!collapsed[league] && lgEvents.map(event => (
                  <MatchRow key={event.id} event={event} sel={getLegSel(event.id)} market={market} onSelect={toggleSel} />
                ))}
              </div>
            ))
          )}
        </div>

        {/* BET SLIP */}
        <BetSlip slip={slip} setSlip={setSlip} wallet={wallet} onPlace={handlePlace} placing={placing}
          onBook={handleBook} onLoadCode={() => setBookingModal('load')} />
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <BookingModal
          code={bookingModal !== 'load' ? bookingModal.code : null}
          legs={bookingModal !== 'load' ? bookingModal.legs : null}
          totalOdds={bookingModal !== 'load' ? bookingModal.totalOdds : 0}
          onClose={() => setBookingModal(null)}
          onLoad={handleLoadBooking}
        />
      )}
    </>
  );
}
