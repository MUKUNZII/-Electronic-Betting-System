import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiSearch, FiLock } from 'react-icons/fi';

const DEMO_SPORTS = [
  { icon:'⚽', name:'Football',   count:64 },
  { icon:'🏀', name:'Basketball', count:30 },
  { icon:'🎾', name:'Tennis',     count:38 },
  { icon:'🏏', name:'Cricket',    count:10 },
  { icon:'🥋', name:'MMA',        count:32 },
  { icon:'⚾', name:'Baseball',   count:16 },
  { icon:'🥊', name:'Boxing',     count:45 },
  { icon:'🏉', name:'Rugby',      count:39 },
  { icon:'🏒', name:'Ice Hockey', count:6  },
  { icon:'🎱', name:'Snooker',    count:8  },
];

const DEMO_MATCHES = [
  { id:1, league:'International · FIFA World Cup', time:'Tomorrow 02:00', t1:'Cape Verde',            t2:'Saudi Arabia',           o1:'2.70', ox:'3.30', o2:'2.72', dc1x:'1.57', dcx2:'1.68', dc12:'1.21', live:false, locked:false },
  { id:2, league:'International · FIFA World Cup', time:'Tomorrow 07:00', t1:'Uruguay',               t2:'Spain',                  o1:'6.00', ox:'3.65', o2:'1.70', dc1x:'2.11', dcx2:'1.12', dc12:'1.79', live:false, locked:false },
  { id:3, league:'Mozambique · Cup',               time:'Today 14:45',    t1:'Ferroviário de Lichinga',t2:'Casa Do Sol',            o1:'2.22', ox:'2.77', o2:'3.25', dc1x:'1.33', dcx2:'1.45', dc12:'1.43', live:false, locked:false },
  { id:4, league:'Kazakhstan · Premier League',    time:'Today 15:00',    t1:'FK Taraz',              t2:'Shakhtar Karagandy',     o1:'5.70', ox:'4.80', o2:'1.36', dc1x:'2.65', dcx2:'1.10', dc12:'1.17', live:false, locked:false },
  { id:5, league:'Brazil · U20 Paulista',          time:'Today 15:00',    t1:'EC Água Santa SP U20',  t2:'AA Flamengo SP U20',     o1:'1.42', ox:'4.30', o2:'5.50', dc1x:'1.11', dcx2:'2.19', dc12:'1.22', live:false, locked:false },
  { id:6, league:'Georgia · Cup',                  time:'Today 15:00',    t1:'FC Guria Lanchkhuti',   t2:'FC Merrani Tbilisi',     o1:'1.57', ox:'4.10', o2:'4.20', dc1x:'1.21', dcx2:'1.95', dc12:'1.25', live:false, locked:false },
  { id:7, league:'Georgia · Cup',                  time:'Today 15:00',    t1:'Gardabani',             t2:'FC Iberia 2010 Tbilisi', o1:'1.68', ox:'3.85', o2:'3.80', dc1x:'1.21', dcx2:'1.95', dc12:'1.25', live:true,  locked:false },
  { id:8, league:'Spain · La Liga',                time:'Today 20:00',    t1:'Barcelona',             t2:'Real Madrid',            o1:'2.10', ox:'3.40', o2:'3.20', dc1x:'1.30', dcx2:'1.65', dc12:'1.27', live:false, locked:true  },
];

function OddsBtn({ val, locked }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (locked) return;
    const t = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }, Math.random() * 8000 + 5000);
    return () => clearInterval(t);
  }, [locked]);

  if (locked) return (
    <div style={{ width:52, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'#0d1117', border:'1px solid #131d2b', borderRadius:5 }}>
      <FiLock size={11} color="#1e2a3a" />
    </div>
  );
  return (
    <Link to="/register" style={{ textDecoration:'none' }}>
      <div style={{ width:52, height:36, display:'flex', alignItems:'center', justifyContent:'center', background: flash ? 'rgba(245,158,11,0.2)' : '#111827', border:`1px solid ${flash ? '#f59e0b' : '#1e2a3a'}`, borderRadius:5, fontWeight:700, fontSize:'0.8rem', color: flash ? '#f59e0b' : '#e2e8f0', cursor:'pointer', transition:'all 0.15s' }}>
        {val}
      </div>
    </Link>
  );
}

function MatchRow({ m, market }) {
  return (
    <div style={{ borderBottom:'1px solid #0d1420', padding:'0.5rem 0.875rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>
        {m.live && <span style={{ background:'#ef4444', color:'#fff', borderRadius:3, padding:'0.08rem 0.3rem', fontSize:'0.58rem', fontWeight:700 }}>LIVE</span>}
        <span style={{ fontSize:'0.62rem', color:'#374151', flex:1 }}>{m.league}</span>
        <span style={{ fontSize:'0.62rem', color:'#374151' }}>{m.time}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 52px 52px 52px', gap:4, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#e2e8f0', marginBottom:'0.18rem' }}>{m.t1}</div>
          <div style={{ fontSize:'0.78rem', color:'#6b7280' }}>{m.t2}</div>
        </div>
        {market === '1x2' ? (
          <><OddsBtn val={m.o1} locked={m.locked}/><OddsBtn val={m.ox} locked={m.locked}/><OddsBtn val={m.o2} locked={m.locked}/></>
        ) : (
          <><OddsBtn val={m.dc1x} locked={m.locked}/><OddsBtn val={m.dcx2} locked={m.locked}/><OddsBtn val={m.dc12} locked={m.locked}/></>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeSport, setActiveSport] = useState('Football');
  const [market, setMarket] = useState('1x2');
  const [search, setSearch] = useState('');

  const filtered = DEMO_MATCHES.filter(m =>
    !search ||
    m.t1.toLowerCase().includes(search.toLowerCase()) ||
    m.t2.toLowerCase().includes(search.toLowerCase())
  );

  const features = [
    { icon:'⚽', title:'Live Sports Betting',  desc:'Football, Basketball, Tennis, Cricket and more with real-time odds.',  link:'/betting',  cta:'Bet Now →' },
    { icon:'💰', title:'Instant Deposits',      desc:'Fund your wallet via MTN MoMo, Airtel Money and more.',               link:'/deposit',  cta:'Deposit →' },
    { icon:'🏆', title:'Big Winnings',          desc:'Competitive odds and huge potential winnings. Accumulators welcome.',  link:'/register', cta:'Start Winning →' },
    { icon:'🔒', title:'Secure & Safe',         desc:'JWT authentication, bcrypt passwords and encrypted transactions.',     link:'/register', cta:'Create Account →' },
    { icon:'📱', title:'Mobile Friendly',       desc:'Fully responsive — bet from any device, anywhere, anytime.',          link:'/betting',  cta:'Open Betting →' },
    { icon:'🎁', title:'Bonuses & Promos',      desc:'Referral bonuses, promo codes, and exclusive offers for members.',    link:'/register', cta:'Claim Bonus →' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1a', color:'#e2e8f0' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background:'#0d1117', borderBottom:'1px solid #1e2a3a', position:'sticky', top:0, zIndex:100 }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'54px' }}>
          <Link to="/" style={{ fontWeight:900, fontSize:'1.2rem', display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none' }}>
            <span>🎰</span><span style={{ color:'#f59e0b' }}>BetSystem</span>
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={toggleTheme} style={{ background:'none', border:'none', color:'#4b5563', fontSize:'1rem', cursor:'pointer', padding:'0.25rem' }}>
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <Link to="/leaderboard" style={{ color:'#6b7280', fontSize:'0.82rem', textDecoration:'none' }}>Leaderboard</Link>
            <Link to="/login"    style={{ padding:'0.4rem 1rem', borderRadius:7, border:'1px solid #1e2a3a', color:'#e2e8f0', fontSize:'0.85rem', fontWeight:600, textDecoration:'none' }}>Login</Link>
            <Link to="/register" style={{ padding:'0.4rem 1rem', borderRadius:7, border:'none', color:'#000', fontSize:'0.85rem', fontWeight:800, background:'#f59e0b', textDecoration:'none' }}>Join</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO — 3-column layout ── */}
      <section style={{ borderBottom:'1px solid #1e2a3a' }}>
        <div style={{ display:'grid', gridTemplateColumns:'190px 1fr 270px', maxWidth:1280, margin:'0 auto', minHeight:'calc(100vh - 54px)' }}>

          {/* LEFT: Sports sidebar */}
          <div style={{ background:'#0d1117', borderRight:'1px solid #1e2a3a', overflowY:'auto' }}>
            <div style={{ padding:'0.625rem' }}>
              <div style={{ position:'relative' }}>
                <FiSearch style={{ position:'absolute', left:'0.5rem', top:'50%', transform:'translateY(-50%)', color:'#374151', fontSize:'0.75rem' }}/>
                <input
                  style={{ width:'100%', padding:'0.45rem 0.5rem 0.45rem 1.75rem', background:'#111827', border:'1px solid #1e2a3a', borderRadius:6, color:'#e2e8f0', fontSize:'0.75rem', outline:'none', boxSizing:'border-box' }}
                  placeholder="Search teams, events..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            {DEMO_SPORTS.map(s => (
              <button key={s.name} onClick={() => setActiveSport(s.name)}
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', width:'100%', padding:'0.55rem 0.875rem', border:'none', background: activeSport===s.name ? 'rgba(245,158,11,0.1)' : 'transparent', color: activeSport===s.name ? '#f59e0b' : '#6b7280', fontSize:'0.82rem', fontWeight: activeSport===s.name ? 600 : 400, cursor:'pointer', textAlign:'left', borderLeft: activeSport===s.name ? '3px solid #f59e0b' : '3px solid transparent' }}>
                <span>{s.icon}</span>
                <span style={{ flex:1 }}>{s.name}</span>
                <span style={{ fontSize:'0.65rem', background:'#1e2a3a', borderRadius:999, padding:'0.08rem 0.35rem', color:'#4b5563' }}>({s.count})</span>
              </button>
            ))}
          </div>

          {/* CENTRE: Match list */}
          <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* Market tabs + column headers */}
            <div style={{ padding:'0.5rem 0.875rem', background:'#0d1117', borderBottom:'1px solid #1e2a3a', display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
              {[['1x2','1 X 2'],['dc','Double Chance']].map(([k,l]) => (
                <button key={k} onClick={() => setMarket(k)}
                  style={{ padding:'0.3rem 0.875rem', borderRadius:5, border:'1px solid', borderColor: market===k?'#f59e0b':'#1e2a3a', background: market===k?'rgba(245,158,11,0.12)':'transparent', color: market===k?'#f59e0b':'#4b5563', fontSize:'0.75rem', fontWeight: market===k?600:400, cursor:'pointer' }}>
                  {l}
                </button>
              ))}
              <div style={{ marginLeft:'auto', display:'grid', gridTemplateColumns:'52px 52px 52px', gap:4 }}>
                {(market==='1x2' ? ['1','X','2'] : ['1X','X2','12']).map(h => (
                  <div key={h} style={{ textAlign:'center', fontSize:'0.68rem', color:'#374151', fontWeight:700 }}>{h}</div>
                ))}
              </div>
            </div>
            {/* Scrollable matches */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {filtered.map(m => <MatchRow key={m.id} m={m} market={market}/>)}
              {/* Lock gate */}
              <div style={{ padding:'2rem', textAlign:'center', borderTop:'1px solid #1e2a3a' }}>
                <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>🔒</div>
                <div style={{ color:'#4b5563', fontSize:'0.82rem', marginBottom:'1rem' }}>
                  Sign in to see all {activeSport} matches and place bets
                </div>
                <Link to="/register"
                  style={{ display:'inline-block', padding:'0.625rem 2rem', background:'#f59e0b', color:'#000', borderRadius:8, fontWeight:800, fontSize:'0.9rem', textDecoration:'none' }}>
                  Join Free →
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Bet slip */}
          <div style={{ background:'#0d1117', borderLeft:'1px solid #1e2a3a', display:'flex', flexDirection:'column' }}>
            {/* Tabs */}
            <div style={{ display:'flex', flexShrink:0 }}>
              {['BETSLIP (0)','MY BETS (0)'].map((t,i) => (
                <button key={t} style={{ flex:1, padding:'0.625rem 0.5rem', border:'none', borderBottom: i===0 ? '2px solid #f59e0b' : '2px solid transparent', background:'transparent', color: i===0 ? '#f59e0b' : '#374151', fontSize:'0.68rem', fontWeight:600, cursor:'pointer' }}>{t}</button>
              ))}
            </div>
            {/* Accept odds */}
            <div style={{ padding:'0.5rem 0.875rem', borderBottom:'1px solid #1e2a3a', display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
              <div style={{ width:14, height:14, borderRadius:3, background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', flexShrink:0, color:'#000', fontWeight:700 }}>✓</div>
              <span style={{ fontSize:'0.7rem', color:'#4b5563', flex:1 }}>Accept Odds Changes</span>
              <button style={{ fontSize:'0.65rem', color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>Remove All</button>
            </div>
            {/* Booking code */}
            <div style={{ padding:'0.5rem 0.875rem', borderBottom:'1px solid #1e2a3a', display:'flex', gap:'0.5rem', flexShrink:0 }}>
              <input style={{ flex:1, padding:'0.4rem 0.625rem', background:'#111827', border:'1px solid #1e2a3a', borderRadius:5, color:'#e2e8f0', fontSize:'0.75rem', outline:'none' }} placeholder="Booking Code"/>
              <button style={{ padding:'0.4rem 0.75rem', background:'#f59e0b', border:'none', borderRadius:5, color:'#000', fontWeight:700, fontSize:'0.72rem', cursor:'pointer' }}>LOAD</button>
            </div>
            {/* Empty state */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem 1rem', textAlign:'center' }}>
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" style={{ opacity:0.18, marginBottom:'1rem' }}>
                <rect x="12" y="8" width="40" height="48" rx="4" stroke="#94a3b8" strokeWidth="2.5"/>
                <line x1="20" y1="20" x2="44" y2="20" stroke="#94a3b8" strokeWidth="2"/>
                <line x1="20" y1="28" x2="44" y2="28" stroke="#94a3b8" strokeWidth="2"/>
                <line x1="20" y1="36" x2="36" y2="36" stroke="#94a3b8" strokeWidth="2"/>
              </svg>
              <div style={{ fontWeight:700, color:'#374151', fontSize:'0.88rem', marginBottom:'0.375rem' }}>Your Betslip Is Empty</div>
              <div style={{ fontSize:'0.72rem', color:'#1e2a3a', lineHeight:1.6 }}>Please add some selections to place a bet.</div>
            </div>
            {/* CTA */}
            <div style={{ padding:'0.875rem', borderTop:'1px solid #1e2a3a', display:'flex', flexDirection:'column', gap:'0.5rem', flexShrink:0 }}>
              <Link to="/register" style={{ display:'block', textAlign:'center', padding:'0.75rem', background:'#f59e0b', color:'#000', borderRadius:8, fontWeight:800, fontSize:'0.88rem', textDecoration:'none' }}>
                🎯 Start Betting — Join Free
              </Link>
              <Link to="/login" style={{ display:'block', textAlign:'center', padding:'0.5rem', background:'transparent', border:'1px solid #1e2a3a', color:'#4b5563', borderRadius:7, fontWeight:500, fontSize:'0.78rem', textDecoration:'none' }}>
                Already have an account? Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPORTS STRIP ── */}
      <section style={{ background:'#0d1117', borderBottom:'1px solid #1e2a3a', padding:'0.875rem 1rem' }}>
        <div style={{ display:'flex', gap:'0.625rem', justifyContent:'center', flexWrap:'wrap', maxWidth:1280, margin:'0 auto' }}>
          {DEMO_SPORTS.map(s => (
            <Link key={s.name} to="/register" style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', padding:'0.4rem 1rem', borderRadius:999, border:'1px solid #1e2a3a', background:'#111827', color:'#6b7280', fontSize:'0.8rem', fontWeight:500, textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#f59e0b'; e.currentTarget.style.color='#f59e0b'; e.currentTarget.style.background='rgba(245,158,11,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#1e2a3a'; e.currentTarget.style.color='#6b7280'; e.currentTarget.style.background='#111827'; }}
            >{s.icon} {s.name}</Link>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:'5rem 1rem', background:'#0a0f1a' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <h2 style={{ fontSize:'2.25rem', fontWeight:800, marginBottom:'1rem' }}>Why Choose <span style={{ color:'#f59e0b' }}>BetSystem?</span></h2>
            <p style={{ color:'#4b5563', maxWidth:500, margin:'0 auto', fontSize:'0.95rem' }}>Everything you need for a premium betting experience</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:'1.25rem' }}>
            {features.map(f => (
              <Link key={f.title} to={f.link} style={{ textDecoration:'none' }}>
                <div style={{ background:'#0d1117', border:'1px solid #1e2a3a', borderRadius:12, padding:'1.5rem', textAlign:'center', transition:'all 0.25s', height:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.borderColor='rgba(245,158,11,0.4)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(245,158,11,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='#1e2a3a'; e.currentTarget.style.boxShadow='none'; }}
                >
                  <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>{f.icon}</div>
                  <h3 style={{ fontWeight:700, marginBottom:'0.5rem', color:'#e2e8f0', fontSize:'1rem' }}>{f.title}</h3>
                  <p style={{ color:'#4b5563', fontSize:'0.85rem', lineHeight:1.65, flex:1 }}>{f.desc}</p>
                  <div style={{ marginTop:'1rem', display:'inline-flex', alignItems:'center', color:'#f59e0b', fontWeight:600, fontSize:'0.82rem', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:999, padding:'0.35rem 1rem' }}>{f.cta}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'5rem 1rem', background:'#0d1117', borderTop:'1px solid #1e2a3a' }}>
        <div className="container">
          <h2 style={{ textAlign:'center', fontSize:'2.25rem', fontWeight:800, marginBottom:'3rem' }}>How It <span style={{ color:'#f59e0b' }}>Works</span></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1.5rem', textAlign:'center' }}>
            {[
              { step:'01', icon:'📝', title:'Create Account',  desc:'Register in seconds with your email and basic info', link:'/register' },
              { step:'02', icon:'💳', title:'Deposit Funds',   desc:'Add money via mobile money — MTN MoMo, Airtel Money', link:'/deposit' },
              { step:'03', icon:'🎯', title:'Place Your Bet',  desc:'Browse events and place single or accumulator bets',  link:'/betting' },
              { step:'04', icon:'🏆', title:'Win & Withdraw',  desc:'Collect your winnings and withdraw to your account',  link:'/withdraw' },
            ].map(item => (
              <Link key={item.step} to={item.link} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ padding:'1.5rem 1rem', borderRadius:12, border:'1px solid #1e2a3a', background:'#111827', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#f59e0b'; e.currentTarget.style.transform='translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#1e2a3a'; e.currentTarget.style.transform='none'; }}
                >
                  <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#f59e0b', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>STEP {item.step}</div>
                  <div style={{ fontSize:'2.25rem', marginBottom:'0.75rem' }}>{item.icon}</div>
                  <h3 style={{ fontWeight:700, marginBottom:'0.5rem', color:'#e2e8f0', fontSize:'0.9rem' }}>{item.title}</h3>
                  <p style={{ color:'#4b5563', fontSize:'0.8rem', lineHeight:1.55 }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding:'4rem 1rem', background:'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03))', borderTop:'1px solid rgba(245,158,11,0.15)', borderBottom:'1px solid rgba(245,158,11,0.15)' }}>
        <div className="container">
          <div style={{ display:'flex', gap:'2rem', justifyContent:'center', flexWrap:'wrap' }}>
            {[['10,000+','Active Bettors','👥'],['RF 2B+','Total Payouts','💰'],['500+','Events Monthly','⚽'],['99.9%','Uptime','🟢'],['30+','African Currencies','🌍']].map(([v,l,ic]) => (
              <div key={l} style={{ textAlign:'center', minWidth:110 }}>
                <div style={{ fontSize:'1.4rem', marginBottom:'0.25rem' }}>{ic}</div>
                <div style={{ fontSize:'1.9rem', fontWeight:900, color:'#f59e0b', lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:'0.78rem', color:'#4b5563', marginTop:'0.375rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'5rem 1rem', textAlign:'center', background:'#0a0f1a' }}>
        <div className="container">
          <div style={{ maxWidth:580, margin:'0 auto' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎰</div>
            <h2 style={{ fontSize:'2.5rem', fontWeight:900, marginBottom:'1rem', color:'#e2e8f0' }}>Ready to Start Winning?</h2>
            <p style={{ color:'#4b5563', marginBottom:'2.5rem', fontSize:'1rem', lineHeight:1.7 }}>Join thousands of bettors across Africa. Register free, deposit via mobile money, and start betting in minutes.</p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
              <Link to="/register" style={{ padding:'0.875rem 2.5rem', background:'#f59e0b', color:'#000', borderRadius:10, fontWeight:800, fontSize:'1rem', textDecoration:'none' }}>🚀 Create Free Account</Link>
              <Link to="/login"    style={{ padding:'0.875rem 2rem', background:'transparent', border:'1px solid #1e2a3a', color:'#6b7280', borderRadius:10, fontWeight:600, fontSize:'1rem', textDecoration:'none' }}>Login →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#0d1117', borderTop:'1px solid #1e2a3a', padding:'2rem 1rem', textAlign:'center' }}>
        <div className="container">
          <div style={{ fontWeight:900, fontSize:'1.2rem', marginBottom:'0.5rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
            <span>🎰</span><span style={{ color:'#f59e0b' }}>BetSystem</span>
          </div>
          <p style={{ color:'#374151', fontSize:'0.8rem', marginBottom:'0.375rem' }}>© 2024 Electronic Betting System. All rights reserved.</p>
          <p style={{ color:'#1e2a3a', fontSize:'0.72rem' }}>🔞 18+ only · Bet responsibly · Gambling can be addictive</p>
        </div>
      </footer>

    </div>
  );
}
