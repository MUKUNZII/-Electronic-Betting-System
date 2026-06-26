import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiCopy, FiArrowRight } from 'react-icons/fi';

const RECEIVING_NUMBER = '+250784214441';

const RATES_TO_RWF = {
  RWF:1, USD:1320, EUR:1430, GBP:1670,
  KES:10.20, TZS:0.498, UGX:0.352, ETB:23.37, BIF:0.460,
  DJF:7.43, ERN:88.0, SOS:2.31, SSP:1.015, MWK:0.763,
  ZMW:49.81, ZWL:4.10, MZN:20.69, MGA:0.293, MUR:29.01,
  SCR:97.78, KMF:2.933, NGN:0.835, GHS:84.62, XOF:2.133,
  GNF:0.1535, SLL:0.0600, LRD:6.840, GMD:19.56, CVE:12.69, MRU:33.17,
};
const COUNTRY_CURRENCY = {
  'Kenya':'KES','Tanzania':'TZS','Uganda':'UGX','Rwanda':'RWF','Ethiopia':'ETB',
  'Burundi':'BIF','Djibouti':'DJF','Eritrea':'ERN','Somalia':'SOS','South Sudan':'SSP',
  'Malawi':'MWK','Zambia':'ZMW','Zimbabwe':'ZWL','Mozambique':'MZN','Madagascar':'MGA',
  'Mauritius':'MUR','Seychelles':'SCR','Comoros':'KMF','Nigeria':'NGN','Ghana':'GHS',
  'Senegal':'XOF',"Côte d'Ivoire":'XOF','Mali':'XOF','Burkina Faso':'XOF',
  'Benin':'XOF','Togo':'XOF','Niger':'XOF','Guinea':'GNF','Sierra Leone':'SLL',
  'Liberia':'LRD','Gambia':'GMD','Guinea-Bissau':'XOF','Cape Verde':'CVE','Mauritania':'MRU',
};
const CURRENCY_SYMBOLS = {
  RWF:'RF',USD:'$',EUR:'€',GBP:'£',KES:'KSh',TZS:'TSh',UGX:'USh',ETB:'Br',BIF:'Fr',
  DJF:'Fdj',ERN:'Nfk',SOS:'Sh',SSP:'£',MWK:'MK',ZMW:'ZK',ZWL:'Z$',MZN:'MT',MGA:'Ar',
  MUR:'₨',SCR:'₨',KMF:'CF',NGN:'₦',GHS:'GH₵',XOF:'CFA',GNF:'FG',SLL:'Le',LRD:'L$',
  GMD:'D',CVE:'$',MRU:'UM',
};
const MOBILE_PROVIDERS = {
  'Kenya':'M-Pesa','Tanzania':'M-Pesa / Tigo Pesa','Uganda':'MTN MoMo / Airtel Money',
  'Rwanda':'MTN MoMo / Airtel Money','Ethiopia':'Telebirr','Nigeria':'OPay / Palmpay',
  'Ghana':'MTN MoMo / Vodafone Cash','Senegal':'Orange Money / Wave',
  "Côte d'Ivoire":'Orange Money / MTN MoMo','Burundi':'Lumicash',
};
const COUNTRY_FLAGS = {
  'Kenya':'🇰🇪','Tanzania':'🇹🇿','Uganda':'🇺🇬','Rwanda':'🇷🇼','Ethiopia':'🇪🇹',
  'Nigeria':'🇳🇬','Ghana':'🇬🇭','Senegal':'🇸🇳','Burundi':'🇧🇮',
};

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString();
const MIN_RWF = 1000;
const STEPS = ['Amount', 'Send Money', 'Confirm'];

export default function DepositPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ local_amount: '', sender_phone: '', payment_method: 'mobile_money', promo_code: '' });
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState('deposit');
  const [confirmed, setConfirmed] = useState(null); // success result
  const [copied, setCopied] = useState(false);

  const currency = useMemo(() => COUNTRY_CURRENCY[user?.country] || 'RWF', [user?.country]);
  const symbol = CURRENCY_SYMBOLS[currency] || 'RF';
  const flag = COUNTRY_FLAGS[user?.country] || '🌍';
  const rate = RATES_TO_RWF[currency] || 1;
  const rwfAmount = form.local_amount ? Math.round(parseFloat(form.local_amount) * rate) : 0;
  const minLocal = Math.ceil(MIN_RWF / rate);
  const provider = MOBILE_PROVIDERS[user?.country] || 'Mobile Money';

  useEffect(() => {
    api.get('/wallet').then(({ data }) => setWallet(data.wallet)).catch(() => {});
    api.get('/wallet/deposits').then(({ data }) => setDeposits(data.deposits || [])).catch(() => {});
  }, []);

  const quickAmounts = useMemo(() => {
    const base = Math.ceil(MIN_RWF / rate);
    return [base, base*2, base*5, base*10, base*25].map(v => Math.round(v / base) * base);
  }, [rate]);

  const copyNumber = () => {
    navigator.clipboard.writeText(RECEIVING_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Number copied!');
  };

  // Step 3 — user confirms they sent the money → instantly credit wallet
  const handleConfirm = async () => {
    if (!form.sender_phone.trim()) { toast.error('Enter your phone number'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/deposit', {
        local_amount: parseFloat(form.local_amount),
        local_currency: currency,
        sender_phone: form.sender_phone,
        payment_method: form.payment_method,
        promo_code: form.promo_code || undefined,
      });
      if (data.success) {
        setConfirmed(data.deposit);
        setWallet(prev => prev ? { ...prev, balance: data.deposit.new_balance } : prev);
        api.get('/wallet/deposits').then(({ data }) => setDeposits(data.deposits || [])).catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setConfirmed(null);
    setStep(1);
    setForm({ local_amount: '', sender_phone: '', payment_method: 'mobile_money', promo_code: '' });
  };

  const statusColor = { pending:'warning', approved:'success', rejected:'danger' };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding:'2rem 1rem', maxWidth:'600px' }}>
          <div className="card" style={{ textAlign:'center', padding:'2.5rem 2rem' }}>
            {/* Big checkmark */}
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(34,197,94,0.15)', border:'3px solid #22c55e', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', fontSize:'2.5rem' }}>
              ✅
            </div>

            <h2 style={{ fontWeight:800, fontSize:'1.5rem', marginBottom:'0.5rem', color:'var(--text-primary)' }}>
              Deposit Successful!
            </h2>
            <p style={{ color:'var(--text-muted)', marginBottom:'2rem', fontSize:'0.9rem' }}>
              Your wallet has been credited instantly.
            </p>

            {/* Amount credited */}
            <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.375rem' }}>Amount Credited</div>
              <div style={{ fontSize:'2.5rem', fontWeight:900, color:'#22c55e', lineHeight:1 }}>
                RF {fmt(confirmed.total_credited)}
              </div>
              {confirmed.bonus_rwf > 0 && (
                <div style={{ fontSize:'0.8rem', color:'var(--primary)', marginTop:'0.5rem' }}>
                  🎁 Includes RF {fmt(confirmed.bonus_rwf)} promo bonus!
                </div>
              )}
              {currency !== 'RWF' && (
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.375rem' }}>
                  {symbol} {fmt(confirmed.local_amount)} → RF {fmt(confirmed.rwf_amount)}
                </div>
              )}
            </div>

            {/* New balance */}
            <div style={{ background:'var(--bg-dark)', borderRadius:'10px', padding:'1rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>New Wallet Balance</span>
              <span style={{ fontWeight:800, fontSize:'1.25rem', color:'var(--primary)' }}>
                RF {fmt(confirmed.new_balance)}
              </span>
            </div>

            {/* Reference */}
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'2rem' }}>
              Reference: <span style={{ fontFamily:'monospace', color:'var(--text-secondary)' }}>{confirmed.reference}</span>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <a href="/betting" className="btn btn-primary" style={{ flex:2, justifyContent:'center', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                🎯 Start Betting <FiArrowRight size={14}/>
              </a>
              <button onClick={startNew} className="btn btn-secondary" style={{ flex:1 }}>
                + Deposit More
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding:'2rem 1rem', maxWidth:'700px' }}>
        <div className="page-header">
          <h1 className="page-title">{flag} Deposit Funds</h1>
          <p className="page-subtitle">All deposits are converted to Rwandan Franc (RWF)</p>
        </div>

        {/* Wallet balance */}
        {wallet && (
          <div className="stat-card" style={{ marginBottom:'1.5rem' }}>
            <div className="stat-icon" style={{ background:'rgba(245,158,11,0.15)' }}>💰</div>
            <div>
              <div className="stat-value">RF {fmt(wallet.balance)}</div>
              <div className="stat-label">Current Balance (RWF)</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
          <button onClick={() => setTab('deposit')} className={`btn ${tab==='deposit'?'btn-primary':'btn-secondary'}`}>💳 Make Deposit</button>
          <button onClick={() => setTab('history')} className={`btn ${tab==='history'?'btn-primary':'btn-secondary'}`}>📋 History</button>
        </div>

        {tab === 'deposit' && (
          <div>
            {/* Step indicator */}
            <div style={{ display:'flex', alignItems:'center', marginBottom:'1.5rem', gap:'0.5rem' }}>
              {STEPS.map((label, i) => (
                <React.Fragment key={label}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: step > i+1 ? 'var(--success)' : step === i+1 ? 'var(--primary)' : 'var(--border)', color: step >= i+1 ? '#000' : 'var(--text-muted)', fontWeight:700, fontSize:'0.8rem' }}>
                      {step > i+1 ? '✓' : i+1}
                    </div>
                    <span style={{ fontSize:'0.7rem', color: step >= i+1 ? 'var(--primary)' : 'var(--text-muted)', whiteSpace:'nowrap' }}>{label}</span>
                  </div>
                  {i < STEPS.length-1 && <div style={{ flex:1, height:2, background: step > i+1 ? 'var(--success)' : 'var(--border)', marginBottom:'1rem' }} />}
                </React.Fragment>
              ))}
            </div>

            {/* STEP 1 — Amount */}
            {step === 1 && (
              <div className="card">
                <h3 style={{ fontWeight:700, marginBottom:'1.25rem' }}>Step 1: Enter Amount</h3>
                <div className="form-group">
                  <label className="form-label">Amount in {currency} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>· Min: {symbol} {fmt(minLocal)}</span></label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', background:'var(--primary)', color:'#000', borderRadius:'6px', padding:'0.2rem 0.6rem', fontWeight:700, fontSize:'0.8rem', pointerEvents:'none', zIndex:1 }}>
                      {flag} {currency}
                    </div>
                    <input type="number" className="form-input" style={{ paddingLeft:'5.5rem', fontSize:'1.25rem', fontWeight:600 }}
                      placeholder={`e.g. ${fmt(minLocal * 5)}`} min={minLocal} step="1"
                      value={form.local_amount} onChange={e => setForm(p => ({ ...p, local_amount: e.target.value }))} />
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem', flexWrap:'wrap' }}>
                    {quickAmounts.map(amt => (
                      <button key={amt} type="button" onClick={() => setForm(p => ({ ...p, local_amount: amt.toString() }))}
                        style={{ padding:'0.375rem 0.875rem', borderRadius:'999px', border:'1px solid', borderColor: form.local_amount===amt.toString()?'var(--primary)':'var(--border)', background: form.local_amount===amt.toString()?'rgba(245,158,11,0.1)':'transparent', color: form.local_amount===amt.toString()?'var(--primary)':'var(--text-secondary)', fontSize:'0.8rem', cursor:'pointer' }}>
                        {symbol} {fmt(amt)}
                      </button>
                    ))}
                  </div>
                  {form.local_amount && rwfAmount > 0 && currency !== 'RWF' && (
                    <div style={{ marginTop:'0.75rem', padding:'0.625rem 0.875rem', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'8px', display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                      <span style={{ color:'var(--text-muted)' }}>= Rwandan Francs</span>
                      <strong style={{ color:'var(--primary)' }}>RF {fmt(rwfAmount)}</strong>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Promo Code <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span></label>
                  <input className="form-input" placeholder="Enter promo code" value={form.promo_code}
                    onChange={e => setForm(p => ({ ...p, promo_code: e.target.value.toUpperCase() }))} />
                </div>
                <button className="btn btn-primary btn-full btn-lg"
                  disabled={!form.local_amount || parseFloat(form.local_amount) < minLocal}
                  onClick={() => { if (parseFloat(form.local_amount) < minLocal) { toast.error(`Minimum is ${symbol} ${fmt(minLocal)}`); return; } setStep(2); }}>
                  Continue → Send Money
                </button>
              </div>
            )}

            {/* STEP 2 — Send payment */}
            {step === 2 && (
              <div className="card">
                <h3 style={{ fontWeight:700, marginBottom:'1.25rem' }}>Step 2: Send Money Now</h3>

                {/* Amount summary */}
                <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))', border:'2px solid rgba(245,158,11,0.4)', borderRadius:'14px', padding:'1.25rem', marginBottom:'1.25rem', textAlign:'center' }}>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.375rem' }}>You are sending</div>
                  <div style={{ fontSize:'2rem', fontWeight:900, color:'var(--primary)', lineHeight:1, marginBottom:'0.25rem' }}>
                    {symbol} {fmt(parseFloat(form.local_amount))}
                  </div>
                  {currency !== 'RWF' && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>= RF {fmt(rwfAmount)}</div>}
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>to <strong style={{ color:'var(--primary)', fontFamily:'monospace' }}>{RECEIVING_NUMBER}</strong></div>
                </div>

                {/* ── USSD Quick Dial buttons ── */}
                <div style={{ marginBottom:'1.25rem' }}>
                  <div style={{ fontWeight:700, fontSize:'0.875rem', marginBottom:'0.875rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <span style={{ background:'#22c55e', borderRadius:'50%', width:22, height:22, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', color:'#fff', fontWeight:800, flexShrink:0 }}>⚡</span>
                    Tap to dial automatically — your phone will open the payment screen
                  </div>

                  {/* Option 1 — MTN MoMo Pay (merchant code) */}
                  <a
                    href={`tel:*182*8*1*496836%23`}
                    style={{ display:'block', textDecoration:'none', marginBottom:'0.75rem' }}
                    onClick={() => toast.success('Opening MTN MoMo Pay on your phone…')}
                  >
                    <div style={{ background:'rgba(255,204,0,0.08)', border:'2px solid rgba(255,204,0,0.4)', borderRadius:'12px', padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', cursor:'pointer', transition:'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,204,0,0.15)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,204,0,0.08)'; e.currentTarget.style.transform='none'; }}
                    >
                      <div style={{ width:44, height:44, borderRadius:10, background:'rgba(255,204,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📲</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:'#e2e8f0', fontSize:'0.9rem', marginBottom:'0.2rem' }}>MTN MoMo Pay (Recommended)</div>
                        <div style={{ fontFamily:'monospace', color:'#fcd34d', fontSize:'0.85rem', fontWeight:600, letterSpacing:'0.05em' }}>*182*8*1*496836#</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>Direct merchant payment · No recipient number needed</div>
                      </div>
                      <div style={{ background:'#f59e0b', color:'#000', borderRadius:8, padding:'0.375rem 0.75rem', fontWeight:700, fontSize:'0.78rem', flexShrink:0 }}>
                        DIAL NOW
                      </div>
                    </div>
                  </a>

                  {/* Option 2 — MTN MoMo Send Money */}
                  <a
                    href={`tel:*182*1*1*0784214441%23`}
                    style={{ display:'block', textDecoration:'none' }}
                    onClick={() => toast.success('Opening MTN MoMo Send Money on your phone…')}
                  >
                    <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'12px', padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', cursor:'pointer', transition:'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(59,130,246,0.12)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(59,130,246,0.06)'; e.currentTarget.style.transform='none'; }}
                    >
                      <div style={{ width:44, height:44, borderRadius:10, background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📱</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:'#e2e8f0', fontSize:'0.9rem', marginBottom:'0.2rem' }}>MTN MoMo Send Money</div>
                        <div style={{ fontFamily:'monospace', color:'#93c5fd', fontSize:'0.85rem', fontWeight:600, letterSpacing:'0.05em' }}>*182*1*1*0784214441#</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>Send directly to number {RECEIVING_NUMBER}</div>
                      </div>
                      <div style={{ background:'#3b82f6', color:'#fff', borderRadius:8, padding:'0.375rem 0.75rem', fontWeight:700, fontSize:'0.78rem', flexShrink:0 }}>
                        DIAL
                      </div>
                    </div>
                  </a>
                </div>

                {/* Manual instructions fallback */}
                <div style={{ background:'var(--bg-dark)', borderRadius:'10px', padding:'1rem', marginBottom:'1.25rem', border:'1px solid var(--border)' }}>
                  <div style={{ fontWeight:600, fontSize:'0.8rem', marginBottom:'0.625rem', color:'var(--text-secondary)' }}>
                    📋 Or dial manually on your phone:
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                    {[
                      { code:'*182*8*1*496836#',        label:'MoMo Pay (merchant)', color:'#fcd34d' },
                      { code:'*182*1*1*0784214441#',    label:'Send Money to number',color:'#93c5fd' },
                    ].map(item => (
                      <div key={item.code} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem' }}>
                        <div>
                          <span style={{ fontFamily:'monospace', fontWeight:700, color:item.color, fontSize:'0.9rem' }}>{item.code}</span>
                          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginLeft:'0.5rem' }}>{item.label}</span>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(item.code); toast.success('Copied!'); }}
                          style={{ background:'var(--border)', border:'none', borderRadius:5, padding:'0.25rem 0.5rem', color:'var(--text-secondary)', cursor:'pointer', fontSize:'0.7rem', flexShrink:0 }}>
                          <FiCopy size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.75rem', lineHeight:1.6 }}>
                    After dialing, enter amount <strong style={{ color:'var(--primary)' }}>{symbol} {fmt(parseFloat(form.local_amount))}</strong> and confirm with your PIN.
                  </div>
                </div>

                <div className="alert alert-warning" style={{ marginBottom:'1.25rem', fontSize:'0.82rem' }}>
                  ⚠️ Send the exact amount shown above. After payment is complete, click the button below.
                </div>

                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex:1 }}>← Back</button>
                  <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flex:2, fontSize:'0.95rem' }}>
                    ✅ I've Sent the Money →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Confirm */}
            {step === 3 && (
              <div className="card">
                <h3 style={{ fontWeight:700, marginBottom:'0.5rem' }}>Step 3: Confirm Your Payment</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'1.25rem' }}>
                  Confirm you have sent the money and your wallet will be credited instantly.
                </p>

                {/* Summary */}
                <div style={{ background:'var(--bg-dark)', borderRadius:'10px', padding:'0.875rem 1rem', marginBottom:'1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>You sent</div>
                    <div style={{ fontWeight:700, color:'var(--primary)', fontSize:'1.1rem' }}>{symbol} {fmt(parseFloat(form.local_amount))} → RF {fmt(rwfAmount)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>To</div>
                    <div style={{ fontWeight:600, fontFamily:'monospace', fontSize:'0.875rem' }}>{RECEIVING_NUMBER}</div>
                  </div>
                </div>

                {/* Phone number */}
                <div className="form-group">
                  <label className="form-label">Your Phone Number (that you sent from) *</label>
                  <input type="tel" className="form-input"
                    placeholder={`e.g. 07XXXXXXXX`}
                    value={form.sender_phone}
                    onChange={e => setForm(p => ({ ...p, sender_phone: e.target.value }))}
                    required />
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.25rem' }}>
                    We need this to verify your payment
                  </div>
                </div>

                {/* Confirmation checkbox */}
                <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'10px', padding:'1rem', marginBottom:'1.25rem' }}>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', cursor:'pointer' }}>
                    <input type="checkbox" id="confirm-check" style={{ marginTop:'0.2rem', accentColor:'var(--success)', width:18, height:18, flexShrink:0 }}
                      onChange={e => { document.getElementById('confirm-btn').disabled = !e.target.checked; }} />
                    <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.6 }}>
                      I confirm that I have sent <strong style={{ color:'var(--primary)' }}>{symbol} {fmt(parseFloat(form.local_amount))}</strong> to <strong style={{ color:'var(--primary)', fontFamily:'monospace' }}>{RECEIVING_NUMBER}</strong> via {provider} and the payment was successful.
                    </span>
                  </label>
                </div>

                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button type="button" onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex:1 }}>← Back</button>
                  <button id="confirm-btn" onClick={handleConfirm} className="btn btn-primary" style={{ flex:2 }} disabled={true}>
                    {loading ? '⏳ Processing...' : '✅ Confirm & Credit Wallet'}
                  </button>
                </div>

                <div style={{ marginTop:'0.875rem', fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center' }}>
                  🔒 Your wallet will be credited instantly after confirmation
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Deposit History</h3>
            {deposits.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No deposits yet</div>
                <button onClick={() => setTab('deposit')} className="btn btn-primary btn-sm" style={{ marginTop:'0.75rem' }}>Make First Deposit</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Amount (RWF)</th>
                      <th>Original</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{d.reference}</td>
                        <td style={{ fontWeight:700, color:'var(--success)' }}>RF {fmt(d.rwf_amount || d.amount)}</td>
                        <td style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
                          {d.local_currency && d.local_currency !== 'RWF'
                            ? `${CURRENCY_SYMBOLS[d.local_currency]||d.local_currency} ${fmt(d.local_amount)}`
                            : '—'}
                        </td>
                        <td style={{ fontSize:'0.8rem', fontFamily:'monospace' }}>{d.sender_phone || '—'}</td>
                        <td><span className={`badge badge-${statusColor[d.status]}`}>{d.status}</span></td>
                        <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
