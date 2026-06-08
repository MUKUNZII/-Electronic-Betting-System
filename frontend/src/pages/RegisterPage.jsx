import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── East & West African countries with dial codes and flag emojis ──────────
const AFRICAN_COUNTRIES = [
  // ── EAST AFRICA ──────────────────────────────────────────────────────────
  { region: 'East Africa', name: 'Burundi',          code: 'BI', dial: '+257', flag: '🇧🇮', placeholder: '+257 XX XXX XXX',  pattern: /^\+257\d{8}$/ },
  { region: 'East Africa', name: 'Comoros',          code: 'KM', dial: '+269', flag: '🇰🇲', placeholder: '+269 XXX XXXX',    pattern: /^\+269\d{7}$/ },
  { region: 'East Africa', name: 'Djibouti',         code: 'DJ', dial: '+253', flag: '🇩🇯', placeholder: '+253 XX XX XX XX', pattern: /^\+253\d{8}$/ },
  { region: 'East Africa', name: 'Eritrea',          code: 'ER', dial: '+291', flag: '🇪🇷', placeholder: '+291 X XXX XXXX',  pattern: /^\+291\d{7}$/ },
  { region: 'East Africa', name: 'Ethiopia',         code: 'ET', dial: '+251', flag: '🇪🇹', placeholder: '+251 9X XXX XXXX', pattern: /^\+251\d{9}$/ },
  { region: 'East Africa', name: 'Kenya',            code: 'KE', dial: '+254', flag: '🇰🇪', placeholder: '+254 7XX XXX XXX', pattern: /^\+254\d{9}$/ },
  { region: 'East Africa', name: 'Madagascar',       code: 'MG', dial: '+261', flag: '🇲🇬', placeholder: '+261 XX XX XXX XX',pattern: /^\+261\d{9}$/ },
  { region: 'East Africa', name: 'Malawi',           code: 'MW', dial: '+265', flag: '🇲🇼', placeholder: '+265 X XXX XXXX',  pattern: /^\+265\d{9}$/ },
  { region: 'East Africa', name: 'Mauritius',        code: 'MU', dial: '+230', flag: '🇲🇺', placeholder: '+230 XXXX XXXX',   pattern: /^\+230\d{8}$/ },
  { region: 'East Africa', name: 'Mozambique',       code: 'MZ', dial: '+258', flag: '🇲🇿', placeholder: '+258 8X XXX XXXX', pattern: /^\+258\d{9}$/ },
  { region: 'East Africa', name: 'Rwanda',           code: 'RW', dial: '+250', flag: '🇷🇼', placeholder: '+250 7XX XXX XXX', pattern: /^\+250\d{9}$/ },
  { region: 'East Africa', name: 'Seychelles',       code: 'SC', dial: '+248', flag: '🇸🇨', placeholder: '+248 X XX XXXX',   pattern: /^\+248\d{7}$/ },
  { region: 'East Africa', name: 'Somalia',          code: 'SO', dial: '+252', flag: '🇸🇴', placeholder: '+252 X XXX XXXX',  pattern: /^\+252\d{8}$/ },
  { region: 'East Africa', name: 'South Sudan',      code: 'SS', dial: '+211', flag: '🇸🇸', placeholder: '+211 9X XXX XXXX', pattern: /^\+211\d{9}$/ },
  { region: 'East Africa', name: 'Tanzania',         code: 'TZ', dial: '+255', flag: '🇹🇿', placeholder: '+255 7XX XXX XXX', pattern: /^\+255\d{9}$/ },
  { region: 'East Africa', name: 'Uganda',           code: 'UG', dial: '+256', flag: '🇺🇬', placeholder: '+256 7XX XXX XXX', pattern: /^\+256\d{9}$/ },
  { region: 'East Africa', name: 'Zambia',           code: 'ZM', dial: '+260', flag: '🇿🇲', placeholder: '+260 9X XXX XXXX', pattern: /^\+260\d{9}$/ },
  { region: 'East Africa', name: 'Zimbabwe',         code: 'ZW', dial: '+263', flag: '🇿🇼', placeholder: '+263 7X XXX XXXX', pattern: /^\+263\d{9}$/ },
  // ── WEST AFRICA ──────────────────────────────────────────────────────────
  { region: 'West Africa', name: 'Benin',            code: 'BJ', dial: '+229', flag: '🇧🇯', placeholder: '+229 XX XX XXXX',  pattern: /^\+229\d{8}$/ },
  { region: 'West Africa', name: 'Burkina Faso',     code: 'BF', dial: '+226', flag: '🇧🇫', placeholder: '+226 XX XX XXXX',  pattern: /^\+226\d{8}$/ },
  { region: 'West Africa', name: 'Cape Verde',       code: 'CV', dial: '+238', flag: '🇨🇻', placeholder: '+238 XXX XXXX',    pattern: /^\+238\d{7}$/ },
  { region: 'West Africa', name: 'Côte d\'Ivoire',   code: 'CI', dial: '+225', flag: '🇨🇮', placeholder: '+225 XX XX XXXXXX',pattern: /^\+225\d{10}$/ },
  { region: 'West Africa', name: 'Gambia',           code: 'GM', dial: '+220', flag: '🇬🇲', placeholder: '+220 XXX XXXX',    pattern: /^\+220\d{7}$/ },
  { region: 'West Africa', name: 'Ghana',            code: 'GH', dial: '+233', flag: '🇬🇭', placeholder: '+233 XX XXX XXXX', pattern: /^\+233\d{9}$/ },
  { region: 'West Africa', name: 'Guinea',           code: 'GN', dial: '+224', flag: '🇬🇳', placeholder: '+224 XXX XXX XXX', pattern: /^\+224\d{9}$/ },
  { region: 'West Africa', name: 'Guinea-Bissau',    code: 'GW', dial: '+245', flag: '🇬🇼', placeholder: '+245 XXX XXXX',    pattern: /^\+245\d{7}$/ },
  { region: 'West Africa', name: 'Liberia',          code: 'LR', dial: '+231', flag: '🇱🇷', placeholder: '+231 XX XXX XXXX', pattern: /^\+231\d{8}$/ },
  { region: 'West Africa', name: 'Mali',             code: 'ML', dial: '+223', flag: '🇲🇱', placeholder: '+223 XX XX XXXX',  pattern: /^\+223\d{8}$/ },
  { region: 'West Africa', name: 'Mauritania',       code: 'MR', dial: '+222', flag: '🇲🇷', placeholder: '+222 XX XX XXXX',  pattern: /^\+222\d{8}$/ },
  { region: 'West Africa', name: 'Niger',            code: 'NE', dial: '+227', flag: '🇳🇪', placeholder: '+227 XX XX XXXX',  pattern: /^\+227\d{8}$/ },
  { region: 'West Africa', name: 'Nigeria',          code: 'NG', dial: '+234', flag: '🇳🇬', placeholder: '+234 XXX XXX XXXX',pattern: /^\+234\d{10}$/ },
  { region: 'West Africa', name: 'Senegal',          code: 'SN', dial: '+221', flag: '🇸🇳', placeholder: '+221 XX XXX XXXX', pattern: /^\+221\d{9}$/ },
  { region: 'West Africa', name: 'Sierra Leone',     code: 'SL', dial: '+232', flag: '🇸🇱', placeholder: '+232 XX XXX XXX',  pattern: /^\+232\d{8}$/ },
  { region: 'West Africa', name: 'Togo',             code: 'TG', dial: '+228', flag: '🇹🇬', placeholder: '+228 XX XX XXXX',  pattern: /^\+228\d{8}$/ },
];

// Group by region for the select dropdown
const REGIONS = ['East Africa', 'West Africa'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', phone: '',
    date_of_birth: '', country: '', password: '', confirm_password: '', referral_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCountryData, setSelectedCountryData] = useState(null);

  // When country changes, auto-fill the dial code into phone
  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const countryData = AFRICAN_COUNTRIES.find(c => c.name === countryName) || null;
    setSelectedCountryData(countryData);
    setForm(prev => ({
      ...prev,
      country: countryName,
      phone: countryData ? countryData.dial + ' ' : '',
    }));
  };

  // Phone input handler — keep the dial code prefix locked
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (selectedCountryData) {
      const prefix = selectedCountryData.dial + ' ';
      // Don't let user delete the dial code prefix
      if (!val.startsWith(selectedCountryData.dial)) {
        setForm(prev => ({ ...prev, phone: prefix }));
        return;
      }
    }
    setForm(prev => ({ ...prev, phone: val }));
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validateStep1 = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.username.trim()) errs.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = 'Only letters, numbers, underscores';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.country) errs.country = 'Please select your country';
    if (!form.phone || form.phone.trim() === (selectedCountryData?.dial || '')) {
      errs.phone = 'Phone number is required';
    } else if (selectedCountryData && !selectedCountryData.pattern.test(form.phone.replace(/\s/g, ''))) {
      errs.phone = `Enter a valid ${selectedCountryData.name} number (${selectedCountryData.placeholder})`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = 'Must include uppercase, lowercase, number';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        ...form,
        phone: form.phone.replace(/\s/g, ''), // strip spaces before sending
      });
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Account created! Welcome 🎉');
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const errs = {};
        err.response.data.errors.forEach(e => { errs[e.field] = e.message; });
        setErrors(errs);
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
  ];
  const strengthColors = ['#ef4444', '#f59e0b', '#f59e0b', '#22c55e'];
  const strengthCount = passwordStrength.filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ fontSize: '2rem', fontWeight: 800 }}>
            🎰 <span style={{ color: 'var(--primary)' }}>BetSystem</span>
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Join thousands of bettors across Africa</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
          {[
            { n: 1, label: 'Personal Info' },
            { n: 2, label: 'Security' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s.n ? 'var(--primary)' : 'var(--border)',
                  color: step >= s.n ? '#000' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.875rem',
                }}>{step > s.n ? '✓' : s.n}</div>
                <span style={{ fontSize: '0.7rem', color: step >= s.n ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > s.n ? 'var(--primary)' : 'var(--border)', marginBottom: '1rem' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                {/* Full name + Username */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="John Doe" value={form.full_name} onChange={set('full_name')} />
                    {errors.full_name && <div className="form-error">{errors.full_name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input className="form-input" placeholder="johndoe" value={form.username} onChange={set('username')} />
                    {errors.username && <div className="form-error">{errors.username}</div>}
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                {/* Date of birth */}
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={form.date_of_birth} onChange={set('date_of_birth')}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  />
                </div>

                {/* Country */}
                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <select className="form-input" value={form.country} onChange={handleCountryChange}>
                    <option value="">— Select your country —</option>
                    {REGIONS.map(region => (
                      <optgroup key={region} label={`── ${region} ──`}>
                        {AFRICAN_COUNTRIES.filter(c => c.region === region).map(c => (
                          <option key={c.code} value={c.name}>
                            {c.flag} {c.name} ({c.dial})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.country && <div className="form-error">{errors.country}</div>}
                </div>

                {/* Phone — shown only after country selected */}
                <div className="form-group">
                  <label className="form-label">
                    Phone Number *
                    {selectedCountryData && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {selectedCountryData.flag} {selectedCountryData.name} format
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    {selectedCountryData && (
                      <div style={{
                        position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        background: 'var(--border)', borderRadius: '4px',
                        padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600,
                        color: 'var(--text-primary)', pointerEvents: 'none', zIndex: 1,
                        whiteSpace: 'nowrap',
                      }}>
                        {selectedCountryData.flag} {selectedCountryData.dial}
                      </div>
                    )}
                    <input
                      type="tel"
                      className="form-input"
                      style={{ paddingLeft: selectedCountryData ? '5.5rem' : '1rem' }}
                      placeholder={selectedCountryData ? selectedCountryData.placeholder : 'Select a country first'}
                      value={selectedCountryData ? form.phone.replace(selectedCountryData.dial + ' ', '') : form.phone}
                      disabled={!selectedCountryData}
                      onChange={(e) => {
                        if (!selectedCountryData) return;
                        const digits = e.target.value.replace(/[^\d\s]/g, '');
                        setForm(prev => ({ ...prev, phone: selectedCountryData.dial + ' ' + digits }));
                      }}
                    />
                  </div>
                  {!selectedCountryData && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                      📍 Select your country above to enable phone input
                    </div>
                  )}
                  {errors.phone && <div className="form-error">{errors.phone}</div>}
                </div>

                {/* Referral code */}
                <div className="form-group">
                  <label className="form-label">Referral Code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — earn $10 bonus)</span></label>
                  <input className="form-input" placeholder="e.g. ABC123" value={form.referral_code}
                    onChange={e => setForm(prev => ({ ...prev, referral_code: e.target.value.toUpperCase() }))} />
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg">
                  Continue → Security Setup
                </button>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                {/* Summary of step 1 */}
                <div style={{
                  background: 'var(--bg-dark)', borderRadius: '10px', padding: '0.875rem 1rem',
                  marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{selectedCountryData?.flag || '👤'}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{form.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {form.email} · {form.country} · {form.phone}
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Edit
                  </button>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingRight: '2.75rem' }}
                      placeholder="Min 8 chars, uppercase, number"
                      value={form.password}
                      onChange={set('password')}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <div className="form-error">{errors.password}</div>}

                  {/* Strength bar */}
                  {form.password && (
                    <div style={{ marginTop: '0.625rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.375rem' }}>
                        {passwordStrength.map((ok, i) => (
                          <div key={i} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: ok ? strengthColors[strengthCount - 1] : 'var(--border)',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: strengthColors[strengthCount - 1] }}>
                        {strengthCount === 1 && 'Weak'}
                        {strengthCount === 2 && 'Fair'}
                        {strengthCount === 3 && 'Good'}
                        {strengthCount === 4 && '✓ Strong'}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                        {[
                          { ok: passwordStrength[0], label: '8+ chars' },
                          { ok: passwordStrength[1], label: 'Uppercase' },
                          { ok: passwordStrength[2], label: 'Lowercase' },
                          { ok: passwordStrength[3], label: 'Number' },
                        ].map(r => (
                          <span key={r.label} style={{ fontSize: '0.7rem', color: r.ok ? 'var(--success)' : 'var(--text-muted)' }}>
                            {r.ok ? '✓' : '○'} {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Repeat your password"
                    value={form.confirm_password}
                    onChange={set('confirm_password')}
                  />
                  {form.confirm_password && form.password !== form.confirm_password && (
                    <div className="form-error">Passwords do not match</div>
                  )}
                  {form.confirm_password && form.password === form.confirm_password && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.375rem' }}>✓ Passwords match</div>
                  )}
                  {errors.confirm_password && <div className="form-error">{errors.confirm_password}</div>}
                </div>

                {/* Terms */}
                <div style={{
                  background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '8px', padding: '0.875rem', marginBottom: '1.25rem',
                  fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6,
                }}>
                  By creating an account you confirm you are <strong>18+ years old</strong> and agree to our Terms of Service. Gambling can be addictive — play responsibly.
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account 🎰'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
