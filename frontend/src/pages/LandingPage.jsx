import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiTrendingUp, FiShield, FiZap, FiAward } from 'react-icons/fi';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    { icon: '⚽', title: 'Live Sports Betting', desc: 'Bet on Football, Basketball, Tennis, Cricket and more with real-time odds.' },
    { icon: '💰', title: 'Instant Deposits', desc: 'Fund your wallet instantly via bank transfer, crypto, or mobile money.' },
    { icon: '🏆', title: 'Big Winnings', desc: 'Competitive odds and high potential winnings on every event.' },
    { icon: '🔒', title: 'Secure & Safe', desc: 'Bank-grade security with JWT authentication and encrypted transactions.' },
    { icon: '📱', title: 'Mobile Friendly', desc: 'Fully responsive design — bet from any device, anywhere.' },
    { icon: '🎁', title: 'Bonuses & Promos', desc: 'Referral bonuses, promo codes, and exclusive offers for members.' },
  ];

  const sports = ['⚽ Football', '🏀 Basketball', '🎾 Tennis', '🏏 Cricket', '🥊 Boxing', '🏒 Hockey', '🏉 Rugby', '⛳ Golf'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ fontWeight: 800, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎰</span>
            <span style={{ color: 'var(--primary)' }}>BetSystem</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer' }}>
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <Link to="/leaderboard" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0.5rem' }}>Leaderboard</Link>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '5rem 1rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '999px', padding: '0.375rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--primary)' }}>
            <FiZap size={14} /> Live Betting Available Now
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem' }}>
            The Ultimate<br />
            <span style={{ color: 'var(--primary)' }}>Electronic Betting</span><br />
            Experience
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Place bets on your favorite sports, manage your wallet, and win big. 
            Secure, fast, and thrilling — all in one platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Betting Now 🚀
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Login to Account
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
            {[
              { value: '10,000+', label: 'Active Users' },
              { value: '$2M+', label: 'Total Payouts' },
              { value: '500+', label: 'Events Monthly' },
              { value: '99.9%', label: 'Uptime' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports */}
      <section style={{ padding: '3rem 1rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {sports.map(sport => (
              <span key={sport} style={{
                background: 'var(--bg-dark)', border: '1px solid var(--border)',
                borderRadius: '999px', padding: '0.5rem 1.25rem',
                fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)',
              }}>
                {sport}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 1rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem' }}>
              Why Choose <span style={{ color: 'var(--primary)' }}>BetSystem?</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
              Everything you need for a premium betting experience
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,158,11,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '5rem 1rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 800, marginBottom: '3rem' }}>
            How It <span style={{ color: 'var(--primary)' }}>Works</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            {[
              { step: '01', icon: '📝', title: 'Create Account', desc: 'Register in seconds with your email and basic info' },
              { step: '02', icon: '💳', title: 'Deposit Funds', desc: 'Add money to your wallet using your preferred method' },
              { step: '03', icon: '🎯', title: 'Place Your Bet', desc: 'Browse events and place bets with competitive odds' },
              { step: '04', icon: '🏆', title: 'Win & Withdraw', desc: 'Collect your winnings and withdraw to your account' },
            ].map(item => (
              <div key={item.step}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>STEP {item.step}</div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to Start Winning?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>Join thousands of bettors and start your journey today.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account 🎰
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '2rem 1rem', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            🎰 <span style={{ color: 'var(--primary)' }}>BetSystem</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            © 2024 Electronic Betting System. All rights reserved. | Bet responsibly. 18+
          </p>
        </div>
      </footer>
    </div>
  );
}
