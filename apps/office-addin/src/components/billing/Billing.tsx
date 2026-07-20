import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { X, CreditCard, Download, Check, ChevronRight, Star, ArrowRight } from 'lucide-react';

/* ── Billing Sidebar ── */
const BillingSidebar = ({ activeView, onNav, dark, daysLeft, t }: {
  activeView: string; onNav: (v: string) => void; dark: boolean; daysLeft: number; t: (k: string) => string;
}) => {
  const mainItems = [
    { id: 'bill-plans', label: t('bill.nav.plans') },
    { id: 'bill-active', label: t('bill.nav.active') },
    { id: 'bill-invoices', label: t('bill.nav.invoices') },
    { id: 'bill-checkout', label: t('bill.nav.checkout') },
    { id: 'bill-cancel', label: t('bill.nav.cancel') },
  ];
  const settingsItems = [
    { id: 'settings-general', label: t('bill.settings') },
    { id: 'settings-news', label: t('onboard.news'), badge: 2, badgeColor: 'bg-green-500' },
    { id: 'settings-faq', label: t('onboard.faq'), badge: 20, badgeColor: 'bg-ab-orange' },
  ];

  return (
    <div className={`w-44 flex-shrink-0 flex flex-col border-r p-4 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
      {/* Logo */}
      <div className="mb-4">
        <img src="/logo.jpeg" alt="Absentbox" className="w-10 mb-2" />
        <p className={`text-[9px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{t('bill.general')}</p>
      </div>
      {/* Main nav */}
      <nav className="space-y-0.5 mb-4">
        {mainItems.map((item, i) => {
          const isActive = activeView === item.id || (i === 0 && (activeView === 'bill-plans' || activeView === 'bill-confirmation' || activeView === 'bill-trial'));
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              className={`w-full text-left text-[11px] py-1.5 px-2 rounded-md transition-all ${
                isActive ? 'bg-ab-blue text-white font-semibold' : (dark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              }`}>
              {item.label}
            </button>
          );
        })}
      </nav>
      <hr className={`my-2 ${dark ? 'border-slate-700' : 'border-slate-100'}`} />
      {/* Settings nav */}
      <p className={`text-[9px] mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{t('bill.settings')}</p>
      <nav className="space-y-0.5">
        {settingsItems.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            className={`w-full text-left flex items-center gap-2 text-[11px] py-1.5 px-2 rounded-md ${dark ? 'text-slate-400' : 'text-slate-500 hover:text-slate-700'} transition-all`}>
            <span>{item.label}</span>
            {item.badge && <span className={`ml-auto w-4 h-4 rounded-full ${item.badgeColor} text-white text-[8px] flex items-center justify-center font-bold`}>{item.badge}</span>}
          </button>
        ))}
      </nav>
      {/* Bottom */}
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full border-2 border-ab-orange flex items-center justify-center">
            <span className="text-[9px] font-bold text-ab-red">{daysLeft}</span>
          </div>
          <span className={`text-[9px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('onboard.daysRemain')}</span>
        </div>
        <button onClick={() => onNav('bill-checkout')}
          className="w-full py-1.5 bg-ab-green text-white text-[10px] font-bold rounded-lg hover:bg-ab-green-dark transition-all">
          {t('bill.buyPremium')}
        </button>
      </div>
    </div>
  );
};

/* ── Celebration Illustration SVG ── */
const CelebrationSVG = () => (
  <svg viewBox="0 0 300 220" fill="none" className="w-64 h-48 mx-auto animate-float">
    {/* Person 1 */}
    <circle cx="80" cy="200" rx="35" ry="8" fill="#F1E0DB" opacity="0.3"/>
    <path d="M65 200 C65 160, 60 150, 70 135 L90 135 C100 150, 95 160, 95 200Z" fill="#2A579A"/>
    <circle cx="80" cy="115" r="20" fill="#FDDCB5"/>
    <path d="M65 108 C65 95, 72 88, 80 88 C88 88, 95 95, 95 108" fill="#4A3728"/>
    <path d="M65 135 L50 165 L65 162Z" fill="#FDDCB5"/>
    {/* Person 2 */}
    <circle cx="220" cy="200" rx="35" ry="8" fill="#F1E0DB" opacity="0.3"/>
    <path d="M205 200 C205 160, 200 150, 210 135 L230 135 C240 150, 235 160, 235 200Z" fill="#D4654A"/>
    <circle cx="220" cy="115" r="20" fill="#FDDCB5"/>
    <path d="M205 108 C205 95, 212 88, 220 88 C228 88, 235 95, 235 108 C240 112, 235 120, 230 115" fill="#1A1A1A"/>
    <path d="M235 135 L250 165 L235 162Z" fill="#FDDCB5"/>
    {/* Cards & Coins */}
    <rect x="120" y="60" width="60" height="40" rx="6" fill="#2A579A" transform="rotate(-10 150 80)"/>
    <rect x="130" y="50" width="60" height="40" rx="6" fill="#4A7CC9" transform="rotate(5 160 70)"/>
    <circle cx="150" cy="110" r="15" fill="#FFD700" stroke="#FFA000" strokeWidth="2"/>
    <text x="150" y="115" textAnchor="middle" fill="#B8860B" fontSize="12" fontWeight="bold">$</text>
    <circle cx="180" cy="130" r="12" fill="#FFD700" stroke="#FFA000" strokeWidth="2"/>
    <text x="180" y="135" textAnchor="middle" fill="#B8860B" fontSize="10" fontWeight="bold">€</text>
    <circle cx="125" cy="125" r="10" fill="#FFD700" stroke="#FFA000" strokeWidth="2"/>
    <text x="125" y="129" textAnchor="middle" fill="#B8860B" fontSize="8" fontWeight="bold">$</text>
    {/* Stars */}
    <text x="170" y="40" fill="#FFD700" fontSize="16">★</text>
    <text x="115" y="50" fill="#7C4DFF" fontSize="12">★</text>
    <text x="200" y="55" fill="#4CAF50" fontSize="14">👍</text>
    {/* Wallet */}
    <rect x="130" y="140" width="50" height="40" rx="6" fill="#E8734A"/>
    <rect x="128" y="145" width="54" height="8" rx="2" fill="#B84A33"/>
  </svg>
);

export default function Billing() {
  const { view, setView, settings, t, triggerToast, trialDaysRemaining, currentPlan, setCurrentPlan } = useApp();
  const dark = settings.darkMode;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [country, setCountry] = useState('');
  const [saveData, setSaveData] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Dynamic billing dates — renewal is one month out, invoices are the last two cycles
  const locale = settings.language === 'de' ? 'de-DE' : 'en-GB';
  const fmt = (d: Date) => d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const renewalDate = fmt(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const invoices = [1, 2].map(n => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1));
    return { id: `INV-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, date: fmt(d), amount: '€15.00' };
  });

  const textP = dark ? 'text-white' : 'text-slate-800';
  const textS = dark ? 'text-slate-400' : 'text-slate-500';
  const textM = dark ? 'text-slate-500' : 'text-slate-400';
  const borderC = dark ? 'border-slate-700' : 'border-slate-200';
  const inputCls = `w-full px-3 py-2 border rounded-lg text-xs outline-none ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'} focus:border-ab-orange transition-all`;
  const cardBg = dark ? 'bg-slate-800' : 'bg-white';

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPlan('premium');
    setView('bill-confirmation');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`w-full max-w-[900px] min-h-[520px] rounded-2xl shadow-ab overflow-hidden flex relative border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <button onClick={() => setView('dash-main')} className={`absolute top-4 right-4 z-20 ${textM} hover:text-ab-red`}><X size={18}/></button>
        <BillingSidebar activeView={view} onNav={setView} dark={dark} daysLeft={trialDaysRemaining} t={t} />

        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide animate-fade-in">

          {/* ═══ PLAN SELECTION ═══ */}
          {(view === 'bill-plans' || view === 'bill-trial') && (
            <div>
              <h1 className={`text-2xl font-bold italic mb-2 ${textP}`}>{t('bill.choosePlan')}</h1>
              <p className={`text-xs ${textM} mb-6`}>{t('bill.choosePlanDesc')}</p>
              {/* Billing toggle */}
              <div className="flex justify-end mb-6">
                <div className={`flex border rounded-lg overflow-hidden ${borderC}`}>
                  <button onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 text-[10px] font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-ab-blue text-white' : textS}`}>
                    {t('bill.monthly')}
                  </button>
                  <button onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 text-[10px] font-semibold transition-all ${billingCycle === 'yearly' ? 'bg-ab-blue text-white' : textS}`}>
                    {t('bill.yearly')}
                  </button>
                </div>
              </div>
              {/* Plan cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { name: '14 Day Trial', price: '€0', period: '/Monat', desc: 'Wunderbar einfache Produkterung', popular: false },
                  { name: 'Free', price: '€0', period: '/Monat', desc: 'Entspannen Sie Ihren Kopf und sparen Sie Zeit mit Free.', popular: false },
                  { name: 'Premium', price: billingCycle === 'monthly' ? '€15' : '€12', period: '/Monat', desc: 'Entspannen Sie Ihren Kopf und sparen Sie Zeit mit Premium.', popular: true },
                ].map(plan => (
                  <div key={plan.name}
                    className={`relative rounded-xl border p-5 flex flex-col ${borderC} ${plan.popular ? 'ring-2 ring-ab-blue' : ''} ${dark ? 'bg-slate-700' : 'bg-white'}`}>
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-ab-blue text-white text-[8px] font-bold px-3 py-0.5 rounded-full">{t('bill.popular')}</span>
                    )}
                    <h3 className={`text-sm font-bold mb-2 ${textP}`}>{plan.name}</h3>
                    <div className="mb-3">
                      <span className={`text-2xl font-bold ${textP}`}>{plan.price}</span>
                      <span className={`text-xs ${textM}`}>{plan.period}</span>
                    </div>
                    <p className={`text-[10px] ${textM} mb-4 flex-1`}>{plan.desc}</p>
                    <button onClick={() => {
                      if (plan.name === 'Premium') setView('bill-checkout');
                      else { setCurrentPlan(plan.name === '14 Day Trial' ? 'trial' : 'free'); triggerToast(`${plan.name} selected`); }
                    }}
                      className="w-full py-2 bg-ab-green text-white text-xs font-bold rounded-lg hover:bg-ab-green-dark transition-all">
                      {t('bill.choose')}
                    </button>
                  </div>
                ))}
              </div>
              {/* Feature comparison */}
              <div>
                <h3 className={`text-xs font-bold mb-3 ${textP}`}>Kernfunktionen</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { tier: 'Basic', features: ['Unbegrenzte E-Mail-Kategorisierung', 'Unbegrenztes Teilen', 'Grundlegender Analytics-Zugriff', '10 Zusammenfassungen per E-Mail'] },
                    { tier: 'Premium', features: ['+ Erweiterter Analytics-Zugriff', 'Vorrangiger Support', 'Erweiterte KI-Tools', 'Unbegrenzte Zusammenfassungen'] },
                    { tier: 'Business', features: ['+ Extra Support', 'Team-Management', 'Unbegrenzte Berichte per E-Mail', 'Custom Integrationen'] },
                  ].map(col => (
                    <div key={col.tier}>
                      <p className={`text-[10px] font-bold mb-2 ${textP}`}>{col.tier}</p>
                      <ul className="space-y-1">
                        {col.features.map(f => (
                          <li key={f} className={`text-[9px] ${textM} flex items-start gap-1`}>
                            <Check size={9} className="text-ab-green mt-0.5 flex-shrink-0"/> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <button onClick={() => setView('bill-checkout')}
                  className="px-8 py-2.5 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                  {t('bill.buyPremium')}
                </button>
              </div>
            </div>
          )}

          {/* ═══ CHECKOUT ═══ */}
          {view === 'bill-checkout' && (
            <div className="flex gap-8">
              {/* Left illustration */}
              <div className="hidden md:flex flex-1 flex-col items-center justify-center">
                <CelebrationSVG />
                <p className={`text-xs font-bold mt-4 ${textP}`}>Absentbox Premium</p>
                <p className={`text-[10px] ${textM}`}>Intelligent email management for teams</p>
              </div>
              {/* Right form */}
              <div className="flex-1">
                <h2 className={`text-xl font-bold mb-6 ${textP}`}>{t('bill.checkout')}</h2>
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label className={`block text-[9px] font-bold tracking-wider uppercase mb-1 ${textM}`}>{t('bill.email')}</label>
                    <input type="email" required value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)}
                      placeholder="Email eingeben" className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-bold tracking-wider uppercase mb-1 ${textM}`}>{t('bill.cardNumber')}</label>
                    <div className="relative">
                      <input type="text" required value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                        placeholder="1 234 1234 1234 1234" className={`${inputCls} pr-16`} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <div className="w-6 h-4 bg-blue-600 rounded-sm flex items-center justify-center text-white text-[6px] font-bold">VISA</div>
                        <div className="w-6 h-4 bg-red-500 rounded-sm flex items-center justify-center text-white text-[6px] font-bold">MC</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[9px] font-bold tracking-wider uppercase mb-1 ${textM}`}>{t('bill.expiry')}</label>
                      <input type="text" required value={expiry} onChange={e => setExpiry(e.target.value)}
                        placeholder="DD/MM/YYYY" className={inputCls} />
                    </div>
                    <div>
                      <label className={`block text-[9px] font-bold tracking-wider uppercase mb-1 ${textM}`}>{t('bill.cvc')}</label>
                      <input type="text" required value={cvc} onChange={e => setCvc(e.target.value)}
                        placeholder="000" className={inputCls} maxLength={4} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[9px] font-bold tracking-wider uppercase mb-1 ${textM}`}>{t('bill.cardHolder')}</label>
                    <input type="text" required value={cardHolder} onChange={e => setCardHolder(e.target.value)}
                      placeholder="Namen eingeben" className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-bold tracking-wider uppercase mb-1 ${textM}`}>{t('bill.country')}</label>
                    <select value={country} onChange={e => setCountry(e.target.value)} className={inputCls} required>
                      <option value="">Land auswählen</option>
                      <option value="DE">Deutschland</option>
                      <option value="AT">Österreich</option>
                      <option value="CH">Schweiz</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                  <label className={`flex items-center gap-2 text-[10px] ${textS} cursor-pointer`}>
                    <input type="checkbox" checked={saveData} onChange={e => setSaveData(e.target.checked)} />
                    {t('bill.saveData')}
                  </label>
                  <button type="submit"
                    className={`w-full py-3 text-white text-sm font-bold rounded-lg transition-all ${dark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-800 hover:bg-slate-700'}`}>
                    {t('bill.pay')}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ═══ PAYMENT CONFIRMATION ═══ */}
          {view === 'bill-confirmation' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in-up">
              <CelebrationSVG />
              <h2 className="text-xl font-bold text-ab-blue mt-6">{t('bill.success')}</h2>
            </div>
          )}

          {/* ═══ ACTIVE SUBSCRIPTION ═══ */}
          {view === 'bill-active' && (
            <div>
              <h1 className={`text-xl font-bold mb-6 ${textP}`}>{t('bill.activeTitle')}</h1>
              <div className={`rounded-xl border p-6 ${borderC} ${dark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Star size={20} className="text-ab-orange"/>
                  <h3 className={`text-lg font-bold ${textP}`}>
                    {currentPlan === 'premium' ? 'Premium' : currentPlan === 'trial' ? '14 Day Trial' : 'Free'} Plan
                  </h3>
                </div>
                <div className={`space-y-2 text-xs ${textS}`}>
                  <p>{t('bill.renewal')}: <span className={`font-semibold ${textP}`}>{renewalDate}</span></p>
                  <p>{t('bill.monthlyPrice')}: <span className={`font-semibold ${textP}`}>{currentPlan === 'premium' ? '€15.00' : '€0.00'}</span></p>
                </div>
                {currentPlan === 'premium' && (
                  <button onClick={() => setView('bill-cancel')}
                    className="mt-4 px-6 py-2 border-2 border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all">
                    {t('bill.cancel')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ INVOICES ═══ */}
          {view === 'bill-invoices' && (
            <div>
              <h1 className={`text-xl font-bold mb-6 ${textP}`}>{t('bill.invoicesTitle')}</h1>
              <div className="space-y-3">
                {invoices.map(inv => (
                  <div key={inv.id} className={`flex items-center justify-between p-4 rounded-lg border ${borderC} ${dark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <div>
                      <p className={`text-xs font-bold ${textP}`}>{inv.id}</p>
                      <p className={`text-[10px] ${textM}`}>{inv.date}</p>
                    </div>
                    <span className={`text-sm font-bold ${textP}`}>{inv.amount}</span>
                    <button onClick={() => triggerToast('Invoice PDF downloaded', 'success')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-ab-blue text-white text-[10px] font-semibold rounded-lg hover:bg-ab-blue-light transition-all">
                      <Download size={12}/> PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ CANCEL SUBSCRIPTION ═══ */}
          {view === 'bill-cancel' && (
            <div>
              <h1 className={`text-xl font-bold mb-6 ${textP}`}>{t('bill.cancelTitle')}</h1>
              <div className="space-y-3 mb-6">
                {['Too expensive', 'Missing features', 'Found a better alternative', 'Not using it enough', 'Other'].map(reason => (
                  <label key={reason} className={`flex items-center gap-3 cursor-pointer text-xs ${textS}`}>
                    <input type="radio" name="cancelReason" value={reason} checked={cancelReason === reason}
                      onChange={e => setCancelReason(e.target.value)} className="accent-ab-red" />
                    {reason}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setCurrentPlan('free'); triggerToast('Subscription cancelled', 'info'); setView('bill-plans'); }}
                  className="px-6 py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                  {t('bill.confirmCancel')}
                </button>
                <button onClick={() => setView('bill-active')}
                  className={`text-xs font-medium ${textS} hover:text-ab-red transition-colors`}>
                  {t('bill.goBack')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
