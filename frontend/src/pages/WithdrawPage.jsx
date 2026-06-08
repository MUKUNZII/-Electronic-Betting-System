import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowRight } from 'react-icons/fi';

const RATES_TO_RWF = {
  RWF:1,USD:1320,EUR:1430,GBP:1670,KES:10.20,TZS:0.498,UGX:0.352,ETB:23.37,BIF:0.460,
  DJF:7.43,ERN:88.0,SOS:2.31,SSP:1.015,MWK:0.763,ZMW:49.81,ZWL:4.10,MZN:20.69,MGA:0.293,
  MUR:29.01,SCR:97.78,KMF:2.933,NGN:0.835,GHS:84.62,XOF:2.133,GNF:0.1535,SLL:0.0600,
  LRD:6.840,GMD:19.56,CVE:12.69,MRU:33.17,
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
const MIN_RWF_WITHDRAW = 2000;
const STEPS = ['Amount', 'Account Details', 'Confirm'];

export default function WithdrawPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    amount: '', payment_method: 'mobile_money',
    account_name: '', account_number: '', bank_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState('withdraw');
  const [confirmed, setConfirmed] = useState(null);

  const currency = useMemo(() => COUNTRY_CURRENCY[user?.country] || 'RWF', [user?.country]);
  const symbol = CURRENCY_SYMBOLS[currency] || 'RF';
  const flag = COUNTRY_FLAGS[user?.country] || '🌍';
  const rate = RATES_TO_RWF[currency] || 1;
  const provider = MOBILE_PROVIDERS[user?.country] || 'Mobile Money';

  // Amount is entered in RWF (wallet is RWF), convert to local for display
  const rwfAmount = parseFloat(form.amount) || 0;
  const localEquiv = rwfAmount > 0 && currency !== 'RWF' ? Math.round(rwfAmount / rate) : null;
  const balanceRWF = parseFloat(wallet?.balance || 0);
  const minW = MIN_RWF_WITHDRAW;

  const quickAmounts = [2000, 5000, 10000, 20000, 50000].filter(a => a <= balanceRWF);

  useEffect(() => {
    api.get('/wallet').then(({ data }) => setWallet(data.wallet)).catch(() => {});
    api.get('/wallet/withdrawals').then(({ data }) => setWithdrawals(data.withdrawals || [])).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.account_number.trim()) { toast.error('Enter your account number / phone number'); return; }
    if (!form.account_name.trim()) { toast.error('Enter your account name'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/withdraw', {
        amount: rwfAmount,
        payment_method: form.payment_method,
        account_details: {
          account_name: form.account_name,
          account_number: form.account_number,
          bank_name: form.bank_name,
        },
      });
      if (data.success) {
        setConfirmed({ ...data, rwf_amount: rwfAmount, local_equiv: localEquiv, new_balance: balanceRWF - rwfAmount });
        setWallet(prev => prev ? { ...prev, balance: balanceRWF - rwfAmount } : prev);
        api.get('/wallet/withdrawals').then(({ data }) => setWithdrawals(data.withdrawals || [])).catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => { setConfirmed(null); setStep(1); setForm({ amount:'', payment_method:'mobile_money', account_name:'', account_number:'', bank_name:'' }); };

  const statusColor = { pending:'warning', approved:'success', rejected:'danger' };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding:'2rem 1rem', maxWidth:'600px' }}>
          <div className="card" style={{ textAlign:'center', padding:'2.5rem 2rem' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(59,130,246,0.15)', border:'3px solid #3b82f6', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', fontSize:'2.5rem' }}>
              💸
            </div>
            <h2 style={{ fontWeight:800, fontSize:'1.5rem', marginBottom:'0.5rem' }}>Withdrawal Submitted!</h2>
            <p style={{ color:'var(--text-muted)', marginBottom:'2rem', fontSize:'0.9rem' }}>
              Your withdrawal request has been received and is being processed.
            </p>

            {/* Amount */}
            <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.375rem' }}>Withdrawal Amount</div>
              <div style={{ fontSize:'2.5rem', fontWeight:900, color:'#3b82f6', lineHeight:1 }}>
                RF {fmt(confirmed.rwf_amount)}
              </div>
              {confirmed.local_equiv && (
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>
                  ≈ {symbol} {fmt(confirmed.local_equiv)} in your local currency
                </div>
              )}
            </div>

            {/* New balance */}
            <div style={{ background:'var(--bg-dark)', borderRadius:'10px', padding:'1rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Remaining Balance</span>
              <span style={{ fontWeight:800, fontSize:'1.25rem', color:'var(--primary)' }}>RF {fmt(confirmed.new_balance)}</span>
            </div>

            {/* Timeline */}
            <div style={{ background:'var(--bg-dark)', borderRadius:'10px', padding:'1rem', marginBottom:'1.5rem', textAlign:'left' }}>
              <div style={{ fontSize:'0.8rem', fontWeight:600, marginBottom:'0.75rem', color:'var(--text-secondary)' }}>⏱ Processing Timeline</div>
              {[
                { icon:'✅', label:'Request received', done:true },
                { icon:'🔍', label:'Admin verification (within 24 hours)', done:false },
                { icon:'💸', label:`Sent to your ${provider} account`, done:false },
              ].map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom: i < 2 ? '0.625rem' : 0 }}>
                  <span style={{ fontSize:'1rem', flexShrink:0 }}>{s.icon}</span>
                  <span style={{ fontSize:'0.8rem', color: s.done ? 'var(--success)' : 'var(--text-muted)', fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'1.5rem' }}>
              Reference: <span style={{ fontFamily:'monospace', color:'var(--text-secondary)' }}>{confirmed.reference}</span>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <a href="/betting" className="btn btn-primary" style={{ flex:2, justifyContent:'center', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                🎯 Bet Now <FiArrowRight size={14}/>
              </a>
              <button onClick={startNew} className="btn btn-secondary" style={{ flex:1 }}>New Withdrawal</button>
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
          <h1 className="page-title">{flag} Withdraw Funds</h1>
          <p className="page-subtitle">Withdraw your winnings to your mobile money account</p>
        </div>

        {/* Balance card */}
        {wallet && (
          <div className="stat-card" style={{ marginBottom:'1.5rem' }}>
            <div className="stat-icon" style={{ background:'rgba(34,197,94,0.15)' }}>💰</div>
            <div>
              <div className="stat-value">RF {fmt(wallet.balance)}</div>
              <div className="stat-label">
                Available Balance
                {currency !== 'RWF' && <span style={{ display:'block', fontSize:'0.7rem', color:'var(--text-muted)' }}>≈ {symbol} {fmt(Math.round(parseFloat(wallet.balance) / rate))}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
          <button onClick={() => setTab('withdraw')} className={`btn ${tab==='withdraw'?'btn-primary':'btn-secondary'}`}>💸 Withdraw</button>
          <button onClick={() => setTab('history')} className={`btn ${tab==='history'?'btn-primary':'btn-secondary'}`}>📋 History</button>
        </div>

        {tab === 'withdraw' && (
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
                {balanceRWF < minW && (
                  <div className="alert alert-danger" style={{ marginBottom:'1rem' }}>
                    ❌ Insufficient balance. Minimum withdrawal is RF {fmt(minW)}.
                    <a href="/deposit" style={{ color:'var(--danger)', marginLeft:'0.5rem', fontWeight:600 }}>Deposit funds →</a>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">
                    Amount (RWF)
                    <span style={{ marginLeft:'0.5rem', fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:400 }}>
                      Min: RF {fmt(minW)} · Max: RF {fmt(balanceRWF)}
                    </span>
                  </label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', background:'var(--primary)', color:'#000', borderRadius:'6px', padding:'0.2rem 0.6rem', fontWeight:700, fontSize:'0.8rem', pointerEvents:'none', zIndex:1 }}>
                      🇷🇼 RF
                    </div>
                    <input type="number" className="form-input" style={{ paddingLeft:'5.5rem', fontSize:'1.25rem', fontWeight:600 }}
                      placeholder={`e.g. ${fmt(5000)}`} min={minW} max={balanceRWF} step="100"
                      value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  {/* Quick amounts */}
                  <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem', flexWrap:'wrap' }}>
                    {quickAmounts.map(amt => (
                      <button key={amt} type="button" onClick={() => setForm(p => ({ ...p, amount: amt.toString() }))}
                        style={{ padding:'0.375rem 0.875rem', borderRadius:'999px', border:'1px solid', borderColor: form.amount===amt.toString()?'var(--primary)':'var(--border)', background: form.amount===amt.toString()?'rgba(245,158,11,0.1)':'transparent', color: form.amount===amt.toString()?'var(--primary)':'var(--text-secondary)', fontSize:'0.8rem', cursor:'pointer' }}>
                        RF {fmt(amt)}
                      </button>
                    ))}
                    {balanceRWF >= minW && (
                      <button type="button" onClick={() => setForm(p => ({ ...p, amount: Math.floor(balanceRWF).toString() }))}
                        style={{ padding:'0.375rem 0.875rem', borderRadius:'999px', border:'1px solid var(--border)', background:'transparent', color:'var(--primary)', fontSize:'0.8rem', cursor:'pointer', fontWeight:600 }}>
                        All (RF {fmt(balanceRWF)})
                      </button>
                    )}
                  </div>
                  {/* Local currency equivalent */}
                  {rwfAmount > 0 && currency !== 'RWF' && (
                    <div style={{ marginTop:'0.75rem', padding:'0.625rem 0.875rem', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'8px', display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                      <span style={{ color:'var(--text-muted)' }}>You will receive approx.</span>
                      <strong style={{ color:'var(--primary)' }}>{symbol} {fmt(Math.round(rwfAmount / rate))}</strong>
                    </div>
                  )}
                </div>
                <button className="btn btn-primary btn-full btn-lg"
                  disabled={!form.amount || rwfAmount < minW || rwfAmount > balanceRWF}
                  onClick={() => { if (rwfAmount < minW) { toast.error(`Minimum is RF ${fmt(minW)}`); return; } if (rwfAmount > balanceRWF) { toast.error('Insufficient balance'); return; } setStep(2); }}>
                  Continue → Account Details
                </button>
              </div>
            )}

            {/* STEP 2 — Account Details */}
            {step === 2 && (
              <div className="card">
                <h3 style={{ fontWeight:700, marginBottom:'1.25rem' }}>Step 2: Your Account Details</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'1.25rem' }}>
                  Where should we send RF {fmt(rwfAmount)}?
                </p>

                {/* Payment method */}
                <div className="form-group">
                  <label className="form-label">Withdrawal Method</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.625rem' }}>
                    {[
                      { id:'mobile_money', icon:'📱', label:'Mobile Money', sub: provider },
                      { id:'bank_transfer', icon:'🏦', label:'Bank Transfer', sub:'Local bank' },
                    ].map(m => (
                      <button key={m.id} type="button" onClick={() => setForm(p => ({ ...p, payment_method: m.id }))}
                        style={{ padding:'0.875rem', borderRadius:'10px', border:'2px solid', borderColor: form.payment_method===m.id?'var(--primary)':'var(--border)', background: form.payment_method===m.id?'rgba(245,158,11,0.1)':'var(--bg-dark)', cursor:'pointer', textAlign:'left' }}>
                        <div style={{ fontSize:'1.5rem', marginBottom:'0.25rem' }}>{m.icon}</div>
                        <div style={{ fontWeight:600, fontSize:'0.8rem', color:'var(--text-primary)' }}>{m.label}</div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{m.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account fields */}
                <div style={{ background:'var(--bg-dark)', borderRadius:'10px', padding:'1rem', marginBottom:'1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {form.payment_method === 'mobile_money' ? 'Mobile Number *' : 'Account Number *'}
                    </label>
                    <input className="form-input"
                      placeholder={form.payment_method === 'mobile_money' ? `e.g. 07XXXXXXXX` : 'Account number'}
                      value={form.account_number}
                      onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {form.payment_method === 'mobile_money' ? 'Registered Name *' : 'Account Holder Name *'}
                    </label>
                    <input className="form-input" placeholder="Full name on account"
                      value={form.account_name}
                      onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} />
                  </div>
                  {form.payment_method === 'bank_transfer' && (
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Bank Name *</label>
                      <input className="form-input" placeholder="e.g. Bank of Kigali"
                        value={form.bank_name}
                        onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} />
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex:1 }}>← Back</button>
                  <button onClick={() => {
                    if (!form.account_number.trim()) { toast.error('Enter your account number / phone'); return; }
                    if (!form.account_name.trim()) { toast.error('Enter the account name'); return; }
                    setStep(3);
                  }} className="btn btn-primary" style={{ flex:2 }}>
                    Continue → Confirm
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Confirm */}
            {step === 3 && (
              <div className="card">
                <h3 style={{ fontWeight:700, marginBottom:'0.5rem' }}>Step 3: Confirm Withdrawal</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'1.25rem' }}>
                  Please review and confirm your withdrawal details.
                </p>

                {/* Summary card */}
                <div style={{ background:'var(--bg-dark)', borderRadius:'12px', border:'1px solid var(--border)', overflow:'hidden', marginBottom:'1.25rem' }}>
                  <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Withdrawal Amount</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, fontSize:'1.25rem', color:'var(--primary)' }}>RF {fmt(rwfAmount)}</div>
                      {localEquiv && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>≈ {symbol} {fmt(localEquiv)}</div>}
                    </div>
                  </div>
                  <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Send to</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:600, fontFamily:'monospace' }}>{form.account_number}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{form.account_name}</div>
                    </div>
                  </div>
                  <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Method</span>
                    <span style={{ fontWeight:600 }}>{form.payment_method === 'mobile_money' ? `📱 ${provider}` : '🏦 Bank Transfer'}</span>
                  </div>
                  <div style={{ padding:'1rem', display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Balance after</span>
                    <span style={{ fontWeight:700, color:'var(--success)' }}>RF {fmt(balanceRWF - rwfAmount)}</span>
                  </div>
                </div>

                {/* Confirmation checkbox */}
                <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'10px', padding:'1rem', marginBottom:'1.25rem' }}>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', cursor:'pointer' }}>
                    <input type="checkbox" id="withdraw-check" style={{ marginTop:'0.2rem', accentColor:'var(--info)', width:18, height:18, flexShrink:0 }}
                      onChange={e => { document.getElementById('withdraw-btn').disabled = !e.target.checked; }} />
                    <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.6 }}>
                      I confirm that I want to withdraw <strong style={{ color:'var(--primary)' }}>RF {fmt(rwfAmount)}</strong> to <strong style={{ color:'var(--primary)', fontFamily:'monospace' }}>{form.account_number}</strong> ({form.account_name}) via {form.payment_method === 'mobile_money' ? provider : 'Bank Transfer'}.
                    </span>
                  </label>
                </div>

                <div className="alert alert-info" style={{ marginBottom:'1.25rem', fontSize:'0.8rem' }}>
                  ℹ️ Withdrawals are processed within 1–24 hours. You'll receive a notification once it's sent.
                </div>

                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex:1 }}>← Back</button>
                  <button id="withdraw-btn" onClick={handleSubmit} className="btn btn-primary" style={{ flex:2 }} disabled={true}>
                    {loading ? '⏳ Processing...' : '✅ Confirm Withdrawal'}
                  </button>
                </div>

                <div style={{ marginTop:'0.875rem', fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center' }}>
                  🔒 Funds will be deducted from your wallet immediately
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Withdrawal History</h3>
            {withdrawals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No withdrawals yet</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Reference</th><th>Amount (RWF)</th><th>Method</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(w => (
                      <tr key={w.id}>
                        <td style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{w.reference}</td>
                        <td style={{ fontWeight:700, color:'var(--danger)' }}>RF {fmt(w.amount)}</td>
                        <td style={{ textTransform:'capitalize', fontSize:'0.85rem' }}>{w.payment_method?.replace('_',' ')}</td>
                        <td><span className={`badge badge-${statusColor[w.status]}`}>{w.status}</span></td>
                        <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{new Date(w.created_at).toLocaleDateString()}</td>
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
