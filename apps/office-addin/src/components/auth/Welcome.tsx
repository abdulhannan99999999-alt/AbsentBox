import React, { useState, useEffect, useRef } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../auth";
import { useApp } from '../../store/AppContext';
import { X, Mail, Lock, User, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';

/* ── Inline SVG: Person with Question Mark ── */
const PersonQuestionSVG = () => (
  <svg viewBox="0 0 200 220" fill="none" className="w-44 h-44 animate-float">
    <circle cx="100" cy="190" rx="60" ry="12" fill="#F1E0DB" opacity="0.5"/>
    <path d="M70 190 C70 140, 65 130, 80 110 L120 110 C135 130, 130 140, 130 190Z" fill="#D4654A"/>
    <circle cx="100" cy="80" r="35" fill="#FDDCB5"/>
    <path d="M75 70 C75 50, 85 40, 100 40 C115 40, 125 50, 125 70 C128 70, 130 65, 128 60 C125 45, 115 35, 100 35 C85 35, 75 45, 72 60 C70 65, 72 70, 75 70Z" fill="#8B4513"/>
    <circle cx="88" cy="78" r="3" fill="#333"/>
    <circle cx="112" cy="78" r="3" fill="#333"/>
    <path d="M93 92 Q100 98 107 92" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M75 115 L60 150 L80 145Z" fill="#FDDCB5"/>
    <path d="M125 115 L140 150 L120 145Z" fill="#FDDCB5"/>
    <text x="145" y="55" fill="#D4654A" fontSize="40" fontWeight="900" fontFamily="Inter">?</text>
  </svg>
);

/* ── Feature Checkmark Item ── */
const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3 text-xs leading-relaxed">
    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center">
      <Check size={12} className="text-green-600" />
    </span>
    <p className="text-slate-600 dark:text-slate-400">{text}</p>
  </div>
);

export default function Welcome() {
  const { instance } = useMsal();
  const { view, setView, userProfile, setUserProfile, settings, t, onboarding, setIsAuthenticated } = useApp();
  const dark = settings.darkMode;
  const [msalLoading, setMsalLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regPwRepeat, setRegPwRepeat] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [codes, setCodes] = useState(['', '', '', '']);
  const [saveLogin, setSaveLogin] = useState(true);
  const [forgotEmail, setForgotEmail] = useState('');
  const [formError, setFormError] = useState('');

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-advance from welcome after 3s
  useEffect(() => {
    if (view === 'auth-welcome') {
      const t = setTimeout(() => setView('auth-login'), 3000);
      return () => clearTimeout(t);
    }
  }, [view]);

  const handleMsalLogin = async () => {
    setFormError('');
    setMsalLoading(true);
    try {
      await instance.loginPopup(loginRequest);
      setIsAuthenticated(true);
      // Returning users skip straight to the dashboard; new users onboard first
      setView(onboarding.completed ? 'dash-welcome' : 'onboard-profile');
    } catch (e) {
      console.error("MSAL Login failed:", e);
      setFormError('Microsoft sign-in failed or was cancelled. Please try again.');
    }
    setMsalLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) { setFormError('Please fill in all fields.'); return; }
    setUserProfile(prev => ({ ...prev, email }));
    setView('onboard-profile');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (regPw.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    if (!/[A-Z]/.test(regPw)) { setFormError('Password needs at least 1 capital letter.'); return; }
    if (!/[0-9]/.test(regPw)) { setFormError('Password needs at least 1 number.'); return; }
    if (regPw !== regPwRepeat) { setFormError('Passwords do not match.'); return; }
    if (!termsChecked || !privacyChecked) { setFormError('Please accept terms and privacy policy.'); return; }
    setUserProfile(prev => ({ ...prev, name, surname, email: regEmail }));
    setView('auth-verify');
  };

  const handleCodeChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const next = [...codes];
    next[idx] = val;
    setCodes(next);
    if (val && idx < 3) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (codes.some(c => !c)) { setFormError('Please enter the full 4-digit code.'); return; }
    setView('auth-verify-success');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { setFormError('Please enter your email.'); return; }
    setView('auth-sent');
  };

  const cardBg = dark ? 'bg-slate-800' : 'bg-white';
  const textPrimary = dark ? 'text-white' : 'text-slate-800';
  const textSecondary = dark ? 'text-slate-400' : 'text-slate-500';
  const textMuted = dark ? 'text-slate-500' : 'text-slate-400';
  const inputCls = `w-full px-4 py-3 border-2 border-ab-orange/40 rounded-xl text-sm outline-none transition-all ${
    dark ? 'bg-slate-700 text-white placeholder:text-slate-500 focus:border-ab-orange focus:bg-slate-600' 
         : 'bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-ab-orange focus:bg-white'
  }`;

  /* ─── Branding Side (Login/Register) ─── */
  const BrandingSide = () => (
    <div className={`hidden md:flex flex-1 flex-col items-center justify-center p-10 border-r ${
      dark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-white'
    }`}>
      <img src="/logo.jpeg" alt="Absentbox" className="w-40 mb-8" />
      <div className="max-w-[280px] space-y-4">
        {['feature.1', 'feature.2', 'feature.3', 'feature.4', 'feature.5'].map(key => (
          <FeatureItem key={key} text={t(key)} />
        ))}
      </div>
    </div>
  );

  /* ─── Error Banner ─── */
  const ErrorBanner = () => formError ? (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2 animate-fade-in">
      {formError}
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className={`auth-card w-full max-w-[850px] min-h-[520px] flex relative ${cardBg}`}>

        {/* Close Button */}
        {view !== 'auth-verify-success' && (
          <button id="auth-close" onClick={() => setView('dash-main')}
            className={`absolute top-5 right-5 z-20 ${textMuted} hover:text-ab-red transition-colors`}>
            <X size={20} />
          </button>
        )}

        {/* ═══ WELCOME ═══ */}
        {view === 'auth-welcome' && (
          <div className="w-full flex flex-col items-center justify-center p-12 text-center animate-fade-in cursor-pointer"
               onClick={() => setView('auth-login')}>
            <img src="/logo.jpeg" alt="Absentbox" className="w-48 mb-3 animate-float" />
            <p className="text-[10px] tracking-[3px] text-ab-red font-semibold uppercase mb-8">{t('auth.welcome.tagline')}</p>
            <div className="max-w-md space-y-4 mb-8">
              <h2 className={`text-lg font-bold ${textPrimary}`}>{t('auth.welcome.title')}</h2>
              <p className={`text-sm font-medium ${textSecondary}`}>{t('auth.welcome.sub1')}</p>
              <p className={`text-sm ${textSecondary}`}>{t('auth.welcome.sub2')}</p>
            </div>
            <p className={`text-[10px] italic ${textMuted}`}>{t('auth.welcome.disclaimer')}</p>
          </div>
        )}

        {/* ═══ LOGIN ═══ */}
        {view === 'auth-login' && (
          <>
            <BrandingSide />
            <div className="flex-1 p-10 flex flex-col justify-center animate-fade-in">
              <h2 className={`text-2xl font-bold mb-8 ${textPrimary}`}>{t('auth.login.title')}</h2>
              <form onSubmit={handleLogin} className="space-y-5">
                <ErrorBanner />
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-bold tracking-wider uppercase ${textMuted}`}>{t('auth.login.email')}</label>
                  <input id="login-email" type="email" required value={email} onChange={e => { setEmail(e.target.value); setFormError(''); }}
                    placeholder="Insert email" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-bold tracking-wider uppercase ${textMuted}`}>{t('auth.login.password')}</label>
                  <div className="relative">
                    <input id="login-password" type={showPw ? 'text' : 'password'} required value={password}
                      onChange={e => { setPassword(e.target.value); setFormError(''); }}
                      placeholder="Insert password" className={inputCls + ' pr-10'} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:text-ab-red`}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div className={`flex items-center justify-between text-xs ${textMuted} pb-1`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={saveLogin} onChange={e => setSaveLogin(e.target.checked)} className="rounded" /> {t('auth.login.save')}
                  </label>
                  <button type="button" onClick={() => { setFormError(''); setView('auth-forgot'); }}
                    className="hover:text-ab-red transition-colors">{t('auth.login.forgot')}</button>
                </div>
                <button id="login-submit" type="submit"
                  className="w-full py-3.5 border-2 border-ab-red text-ab-red font-bold rounded-xl hover:bg-ab-red hover:text-white transition-all text-sm">
                  {t('auth.login.submit')}
                </button>
                <button type="button" onClick={handleMsalLogin} disabled={msalLoading}
                  className="w-full py-3.5 border-2 border-ab-blue text-ab-blue font-bold rounded-xl hover:bg-ab-blue hover:text-white transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  <svg viewBox="0 0 21 21" className="w-4 h-4"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
                  {msalLoading ? 'Signing in...' : t('auth.login.microsoft')}
                </button>
                <div className="pt-5 text-center border-t border-slate-200 dark:border-slate-700">
                  <p className={`text-xs mb-3 font-semibold uppercase tracking-wider ${textMuted}`}>{t('auth.login.noAccount')}</p>
                  <button type="button" onClick={() => { setFormError(''); setView('auth-register'); }}
                    className={`w-full py-3 border-2 font-bold rounded-xl transition-all text-xs ${
                      dark ? 'border-white text-white hover:bg-white hover:text-slate-900' : 'border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}>
                    {t('auth.login.register')}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ═══ REGISTER ═══ */}
        {view === 'auth-register' && (
          <div className="w-full flex flex-col items-center p-8 overflow-y-auto scrollbar-hide max-h-[600px] animate-fade-in">
            <img src="/logo.jpeg" alt="Absentbox" className="w-28 mb-4" />
            <h2 className={`text-2xl font-bold mb-5 ${textPrimary}`}>{t('auth.register.title')}</h2>
            <form onSubmit={handleRegister} className="w-full max-w-sm space-y-3">
              <ErrorBanner />
              <input id="reg-name" type="text" required value={name} onChange={e => { setName(e.target.value); setFormError(''); }}
                placeholder="Your name" className={inputCls} />
              <input id="reg-surname" type="text" required value={surname} onChange={e => { setSurname(e.target.value); setFormError(''); }}
                placeholder="Your surname" className={inputCls} />
              <input id="reg-email" type="email" required value={regEmail} onChange={e => { setRegEmail(e.target.value); setFormError(''); }}
                placeholder="Your email" className={inputCls} />
              <div>
                <div className="relative">
                  <input id="reg-pw" type={showRegPw ? 'text' : 'password'} required value={regPw}
                    onChange={e => { setRegPw(e.target.value); setFormError(''); }}
                    placeholder="Choose password" className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowRegPw(!showRegPw)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>
                    {showRegPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <p className={`text-[9px] mt-1 ${textMuted}`}>Your password should contain at least 6 characters with minimum 1x capital letter and 1x number</p>
              </div>
              <input id="reg-pw-repeat" type="password" required value={regPwRepeat}
                onChange={e => { setRegPwRepeat(e.target.value); setFormError(''); }}
                placeholder="Repeat password" className={`${inputCls} border-ab-orange`} />
              <div className={`space-y-2 pt-2 text-[10px] ${textSecondary}`}>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={termsChecked} onChange={e => setTermsChecked(e.target.checked)} className="mt-0.5" />
                  <span>I have taken note of the <strong className="underline cursor-pointer hover:text-ab-red">General Terms and Conditions</strong> and agree to their applicability.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={privacyChecked} onChange={e => setPrivacyChecked(e.target.checked)} className="mt-0.5" />
                  <span>I have taken note of the <strong className="underline cursor-pointer hover:text-ab-red">data protection information</strong>.</span>
                </label>
              </div>
              <button id="reg-submit" type="submit"
                className={`w-full py-3 font-bold rounded-xl transition-all text-sm mt-2 ${
                  dark ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}>
                Register
              </button>
            </form>
          </div>
        )}

        {/* ═══ FORGOT PASSWORD ═══ */}
        {view === 'auth-forgot' && (
          <div className="w-full flex p-10 items-center animate-fade-in">
            <div className="flex-1 hidden md:flex items-center justify-center">
              <PersonQuestionSVG />
            </div>
            <div className="flex-1 space-y-5">
              <h2 className={`text-xl font-bold ${textPrimary}`}>{t('auth.forgot.title')}</h2>
              <p className={`text-xs ${textMuted}`}>Please enter your valid e-mail address to receive the link to reset your password.</p>
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <ErrorBanner />
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-bold tracking-wider uppercase ${textMuted}`}>{t('auth.forgot.label')}</label>
                  <input id="forgot-email" type="email" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setFormError(''); }}
                    placeholder="Insert email" className={inputCls} />
                </div>
                <button id="forgot-submit" type="submit"
                  className="w-full py-3 bg-ab-red text-white font-bold rounded-xl hover:bg-ab-red-dark transition-all text-sm">
                  {t('auth.forgot.submit')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══ PASSWORD SENT ═══ */}
        {view === 'auth-sent' && (
          <div className="w-full flex p-10 items-center animate-fade-in">
            <div className="flex-1 hidden md:flex items-center justify-center">
              <PersonQuestionSVG />
            </div>
            <div className="flex-1 space-y-4">
              <h2 className={`text-xl font-bold ${textPrimary}`}>{t('auth.sent.title')}</h2>
              <hr className={dark ? 'border-slate-700' : 'border-slate-200'} />
            </div>
          </div>
        )}

        {/* ═══ VERIFY CODE ═══ */}
        {view === 'auth-verify' && (
          <div className="w-full flex p-10 items-center animate-fade-in">
            <div className="flex-1 hidden md:flex flex-col items-center justify-center">
              <img src="/logo.jpeg" alt="Absentbox" className="w-36" />
            </div>
            <div className="flex-1 space-y-5">
              <h2 className={`text-xl font-bold ${textPrimary}`}>{t('auth.verify.title')}</h2>
              <p className={`text-xs ${textMuted}`}>Please enter the 4-digit security code we have sent you by e-mail.</p>
              <form onSubmit={handleVerify} className="space-y-5">
                <ErrorBanner />
                <div>
                  <label className={`block text-[10px] font-bold tracking-wider uppercase mb-3 ${textMuted}`}>{t('auth.verify.label')}</label>
                  <div className="flex gap-3">
                    {codes.map((c, i) => (
                      <input key={i} id={`code-${i}`} ref={el => { codeRefs.current[i] = el; }}
                        type="text" maxLength={1} value={c}
                        onChange={e => handleCodeChange(i, e.target.value)}
                        onKeyDown={e => handleCodeKeyDown(i, e)}
                        className={`w-12 h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-center text-lg font-bold outline-none transition-all ${
                          dark ? 'bg-slate-700 text-white focus:border-ab-red' : 'bg-slate-50 focus:border-ab-red focus:bg-white'
                        }`} />
                    ))}
                  </div>
                </div>
                <button type="submit"
                  className="w-full py-3 bg-ab-red text-white font-bold rounded-xl hover:bg-ab-red-dark transition-all text-sm">
                  {t('auth.verify.submit')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══ VERIFY SUCCESS ═══ */}
        {view === 'auth-verify-success' && (
          <div className="w-full flex p-10 items-center animate-fade-in">
            <div className="flex-1 hidden md:flex flex-col items-center justify-center">
              <img src="/logo.jpeg" alt="Absentbox" className="w-36" />
            </div>
            <div className="flex-1 space-y-4">
              <h2 className={`text-2xl font-extrabold ${textPrimary}`}>{t('auth.success.title')}</h2>
              <button onClick={() => setView('onboard-profile')}
                className={`flex items-center gap-2 text-sm font-semibold group ${textSecondary} hover:text-ab-red transition-colors`}>
                {t('auth.success.link')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ EMAIL CONFIRMED ═══ */}
        {view === 'auth-email-confirmed' && (
          <div className="w-full flex p-10 items-center animate-fade-in">
            <div className="flex-1 hidden md:flex flex-col items-center justify-center">
              <img src="/logo.jpeg" alt="Absentbox" className="w-36" />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-extrabold ${textPrimary}`}>{t('auth.confirmed.title')}</h2>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
