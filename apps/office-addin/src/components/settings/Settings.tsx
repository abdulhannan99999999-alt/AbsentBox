import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { User, Settings2, Mail, Bell, HelpCircle, CreditCard, ChevronRight, X, Search, Check, ChevronDown, Trash2, Lock } from 'lucide-react';

/* ── Sidebar ── */
const Sidebar = ({ activeView, onNav, initials, dark, daysLeft, t }: {
  activeView: string; onNav: (v: string) => void; initials: string; dark: boolean; daysLeft: number; t: (k: string) => string;
}) => {
  const items = [
    { id: 'onboard-profile-edit', label: t('onboard.profile'), icon: User },
    { id: '_options', label: t('onboard.options'), icon: Settings2, disabled: true },
    { id: 'onboard-before', label: t('onboard.before'), indent: true },
    { id: 'onboard-after', label: t('onboard.after'), indent: true },
    { id: 'onboard-categories', label: t('onboard.categories'), icon: Mail },
    { id: '_sep', separator: true },
    { id: 'settings-general', label: t('onboard.settings'), icon: Settings2 },
    { id: 'settings-news', label: t('onboard.news'), icon: Bell, badge: 2 },
    { id: 'settings-faq', label: t('onboard.faq'), icon: HelpCircle },
    { id: 'bill-plans', label: t('onboard.payment'), icon: CreditCard },
  ];

  return (
    <div className={`w-48 flex-shrink-0 flex flex-col border-r p-4 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full border-2 border-ab-orange flex items-center justify-center text-sm font-bold text-ab-red bg-orange-50 dark:bg-orange-900/20">{initials}</div>
      </div>
      <nav className="flex-1 space-y-0.5">
        {items.map((item: any) => {
          if (item.separator) return <hr key={item.id} className={`my-3 ${dark ? 'border-slate-700' : 'border-slate-100'}`} />;
          const isActive = activeView === item.id || (activeView.startsWith('settings-') && item.id === 'settings-general' && !['settings-news', 'settings-faq'].includes(activeView));
          return (
            <button key={item.id} onClick={() => !item.disabled && onNav(item.id)}
              className={`w-full text-left flex items-center gap-2 py-1.5 text-[11px] rounded-md transition-all ${item.indent ? 'pl-7' : 'pl-2'} ${
                isActive ? (dark ? 'text-white font-semibold' : 'text-slate-800 font-semibold') : (dark ? 'text-slate-400' : 'text-slate-500 hover:text-slate-700')
              }`}>
              {isActive && <span className="text-ab-red font-bold mr-0.5">›</span>}
              {item.icon && <item.icon size={13}/>}
              <span>{item.label}</span>
              {item.badge && <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">{item.badge}</span>}
            </button>
          );
        })}
      </nav>
      <div className="mt-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-ab-orange flex items-center justify-center">
          <span className="text-[10px] font-bold text-ab-red">{daysLeft}</span>
        </div>
        <span className={`text-[10px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('onboard.daysRemain')}</span>
      </div>
    </div>
  );
};

/* ── Toggle Switch ── */
const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
  <div onClick={onChange} className={`toggle-switch ${on ? 'active' : ''}`} />
);

export default function Settings() {
  const { view, setView, settings, setSettings, userProfile, t, triggerToast, trialDaysRemaining, setIsAuthenticated } = useApp();
  const dark = settings.darkMode;
  const initials = (userProfile.name[0] || '') + (userProfile.surname[0] || '');

  const [langDropdown, setLangDropdown] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const languages = [
    { code: 'de', label: 'German' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
  ];
  const currentLang = languages.find(l => l.code === settings.language)?.label || 'English';

  const faqs = [
    { q: 'What is Absentbox?', a: 'Absentbox is an intelligent email management add-in for Microsoft Outlook. It automatically categorizes, prioritizes, and summarizes your emails during and after your absence.' },
    { q: 'How does AI categorization work?', a: 'Absentbox uses advanced AI algorithms to analyze your email content, sender patterns, and importance signals to automatically sort emails into relevant categories like High Priority, Customer, Supervisor, etc.' },
    { q: 'Is my data secure?', a: 'Yes! Absentbox processes emails locally within your Outlook environment. We use Microsoft\'s secure authentication (MSAL) and never store your email content on external servers.' },
    { q: 'Can I customize categories?', a: 'Absolutely! During onboarding, you can create custom categories, reorder priorities, and define VIP contacts whose emails always get top priority.' },
    { q: 'How do I cancel my subscription?', a: 'You can cancel your subscription at any time from Settings > Payment & Subscription. Your data will be preserved for 30 days after cancellation.' },
  ];

  const textP = dark ? 'text-white' : 'text-slate-800';
  const textS = dark ? 'text-slate-400' : 'text-slate-500';
  const textM = dark ? 'text-slate-500' : 'text-slate-400';
  const borderC = dark ? 'border-slate-700' : 'border-slate-200';
  const inputCls = `px-3 py-2 border rounded-lg text-xs outline-none ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'} focus:border-ab-orange transition-all`;
  const contentBg = dark ? 'bg-slate-700' : 'bg-slate-200';

  const BackLink = ({ to, label }: { to: string; label: string }) => (
    <button onClick={() => setView(to)} className={`text-xs font-medium flex items-center gap-1 ${textS} hover:text-ab-red transition-colors`}>
      {label} <ChevronRight size={12}/>
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`w-full max-w-[900px] min-h-[520px] rounded-2xl shadow-ab overflow-hidden flex relative border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <button onClick={() => setView('dash-main')} className={`absolute top-4 right-4 z-20 ${textM} hover:text-ab-red`}><X size={18}/></button>
        <Sidebar activeView={view} onNav={setView} initials={initials} dark={dark} daysLeft={trialDaysRemaining} t={t} />

        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide animate-fade-in">

          {/* ═══ GENERAL SETTINGS ═══ */}
          {view === 'settings-general' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>{t('settings.title')}</h1>
                <BackLink to="dash-main" label={t('settings.backMail')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column */}
                <div className="space-y-6">
                  {/* Language */}
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${textS}`}>{t('settings.language')}</label>
                    <div className="relative">
                      <button onClick={() => setLangDropdown(!langDropdown)}
                        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-xs ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <div className="flex items-center gap-2">
                          <Search size={12} className={textM}/>
                          <span>{currentLang}</span>
                        </div>
                        <X size={12} className={textM} onClick={e => { e.stopPropagation(); }} />
                      </button>
                      {langDropdown && (
                        <div className={`absolute top-full mt-1 left-0 right-0 border rounded-lg shadow-ab z-10 ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
                          <input value={langSearch} onChange={e => setLangSearch(e.target.value)}
                            placeholder="Search..." className={`w-full px-3 py-2 text-xs border-b ${borderC} outline-none ${dark ? 'bg-slate-700 text-white' : 'bg-white text-slate-700'}`} autoFocus />
                          {languages.filter(l => l.label.toLowerCase().includes(langSearch.toLowerCase())).map(lang => (
                            <button key={lang.code} onClick={() => {
                              setSettings(prev => ({ ...prev, language: lang.code as any }));
                              setLangDropdown(false);
                              setLangSearch('');
                            }}
                              className={`w-full text-left px-3 py-2 text-xs ${textS} hover:bg-slate-100 dark:hover:bg-slate-600 transition-all`}>
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Intelligent functions */}
                  <div>
                    <p className={`text-xs font-bold mb-3 ${textP}`}>{t('settings.intelligent')}</p>
                    {[
                      { num: 10, label: t('settings.summary'), desc: t('settings.summaryDesc'), key: 'summaryEnabled' as const },
                      { num: 11, label: t('settings.tasks'), desc: t('settings.tasksDesc'), key: 'tasksEnabled' as const },
                      { num: 12, label: t('settings.clustering'), desc: t('settings.clusteringDesc'), key: 'clusteringEnabled' as const },
                    ].map(item => (
                      <div key={item.num} className={`flex items-start gap-3 py-3 border-b ${borderC}`}>
                        <span className="w-6 h-6 rounded-md bg-ab-blue text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{item.num}</span>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${textP}`}>{item.label}</p>
                          <p className={`text-[9px] ${textM} mt-0.5 leading-relaxed`}>{item.desc}</p>
                        </div>
                        <Toggle on={settings[item.key]} onChange={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                      </div>
                    ))}
                  </div>
                  {/* Dark mode */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${textS}`}>{t('settings.darkMode')}</span>
                    <div className={`flex border rounded-lg overflow-hidden ${borderC}`}>
                      <button onClick={() => setSettings(prev => ({ ...prev, darkMode: true }))}
                        className={`px-4 py-1.5 text-[10px] font-semibold flex items-center gap-1 transition-all ${settings.darkMode ? 'bg-slate-800 text-white' : `${dark ? 'text-slate-400' : 'text-slate-500'}`}`}>
                        {settings.darkMode && <Check size={10}/>} {t('settings.dark')}
                      </button>
                      <button onClick={() => setSettings(prev => ({ ...prev, darkMode: false }))}
                        className={`px-4 py-1.5 text-[10px] font-semibold flex items-center gap-1 transition-all ${!settings.darkMode ? 'bg-white text-slate-800 border-l border-slate-200' : `text-slate-400 border-l ${borderC}`}`}>
                        {!settings.darkMode && <Check size={10}/>} {t('settings.bright')}
                      </button>
                    </div>
                  </div>
                  {/* Delete account */}
                  <button onClick={() => setView('settings-delete')} className="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors flex items-center gap-1">
                    <Trash2 size={12}/> {t('settings.deleteAccount')}
                  </button>
                </div>
                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${textS}`}>{t('settings.paymentMethod')}</label>
                    <button onClick={() => setView('bill-plans')}
                      className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all ${dark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-800 hover:bg-slate-700'}`}>
                      {t('settings.paymentBtn')}
                    </button>
                  </div>
                  <button onClick={() => setView('settings-terms')} className={`block text-xs ${textS} hover:text-ab-red transition-colors`}>{t('settings.terms')}</button>
                  <button onClick={() => setView('settings-privacy')} className={`block text-xs ${textS} hover:text-ab-red transition-colors`}>{t('settings.privacy')}</button>
                  <button onClick={() => setView('settings-credits')} className={`block text-xs ${textS} hover:text-ab-red transition-colors`}>{t('settings.credits')}</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ NEWS ═══ */}
          {view === 'settings-news' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>News</h1>
                <BackLink to="settings-general" label={t('settings.backSettings')} />
              </div>
              <div className={`text-center py-16 ${textM} text-xs`}>No news at this time.</div>
            </div>
          )}

          {/* ═══ FAQ ═══ */}
          {view === 'settings-faq' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>FAQ</h1>
                <BackLink to="settings-general" label={t('settings.backSettings')} />
              </div>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className={`border rounded-lg overflow-hidden ${borderC}`}>
                    <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold ${textP} hover:bg-slate-50 dark:hover:bg-slate-700 transition-all`}>
                      {faq.q}
                      <ChevronDown size={14} className={`transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
                    </button>
                    {faqOpen === i && (
                      <div className={`px-4 pb-3 text-xs leading-relaxed ${textS} animate-fade-in`}>{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TERMS ═══ */}
          {view === 'settings-terms' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>General Terms & Conditions</h1>
                <BackLink to="settings-general" label={t('settings.backSettings')} />
              </div>
              <div className={`rounded-lg p-8 min-h-[300px] flex items-center justify-center ${contentBg}`}>
                <p className={`text-sm font-bold ${textP}`}>Text with chapters relate to GT&C</p>
              </div>
            </div>
          )}

          {/* ═══ PRIVACY ═══ */}
          {view === 'settings-privacy' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>Privacy Policy</h1>
                <BackLink to="settings-general" label={t('settings.backSettings')} />
              </div>
              <div className={`rounded-lg p-8 min-h-[300px] flex items-center justify-center ${contentBg}`}>
                <p className={`text-sm font-bold ${textP}`}>Text with chapters relate to Privacy Policy</p>
              </div>
            </div>
          )}

          {/* ═══ CREDITS ═══ */}
          {view === 'settings-credits' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>Credits</h1>
                <BackLink to="settings-general" label={t('settings.backSettings')} />
              </div>
              <div className={`rounded-lg p-8 min-h-[300px] flex items-center justify-center ${contentBg}`}>
                <p className={`text-sm font-bold ${textP}`}>Text with chapters relate to Credits</p>
              </div>
            </div>
          )}

          {/* ═══ DELETE ACCOUNT ═══ */}
          {view === 'settings-delete' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>{t('settings.deleteTitle')}</h1>
                <BackLink to="dash-main" label={t('settings.backMail')} />
              </div>
              <p className={`text-sm font-semibold mb-6 ${textP}`}>{t('settings.deleteReason')}</p>
              <div className="space-y-3">
                {['Too expensive', 'Missing features I need', 'Found a better alternative', 'Not using it enough', 'Other reason'].map(reason => (
                  <label key={reason} className={`flex items-center gap-3 cursor-pointer text-xs ${textS}`}>
                    <input type="radio" name="deleteReason" value={reason} checked={deleteReason === reason}
                      onChange={e => setDeleteReason(e.target.value)} className="accent-ab-red" />
                    {reason}
                  </label>
                ))}
              </div>
              <button onClick={() => setView('settings-delete-confirm')}
                className="mt-6 px-6 py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                Continue
              </button>
            </div>
          )}

          {/* ═══ DELETE CONFIRM DIALOG ═══ */}
          {view === 'settings-delete-confirm' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>{t('settings.title')}</h1>
                <BackLink to="dash-main" label={t('settings.backMail')} />
              </div>
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => setView('settings-general')}>
                <div className={`auth-card p-8 max-w-sm text-center animate-scale-in ${dark ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                  <p className={`text-sm font-semibold mb-4 ${textP}`}>{t('settings.deleteConfirm')}</p>
                  <p className={`text-xs mb-2 ${textS}`}>Note:</p>
                  <ul className={`text-xs ${textM} mb-6 list-disc list-inside text-left`}>
                    <li>All your data will be permanently deleted</li>
                    <li>This action cannot be undone</li>
                  </ul>
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setView('settings-delete-password')}
                      className="px-8 py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">Yes</button>
                    <button onClick={() => setView('settings-general')}
                      className="px-8 py-2 border-2 border-ab-red text-ab-red text-xs font-bold rounded-lg hover:bg-ab-red hover:text-white transition-all">No</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ DELETE PASSWORD ═══ */}
          {view === 'settings-delete-password' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-xl font-bold ${textP}`}>{t('settings.title')}</h1>
                <BackLink to="dash-main" label={t('settings.backMail')} />
              </div>
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => setView('settings-general')}>
                <div className={`auth-card p-8 max-w-sm text-center animate-scale-in ${dark ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                  <p className={`text-sm font-semibold mb-2 ${textP}`}>{t('settings.deletePassword')}</p>
                  <p className={`text-xs mb-4 ${textS}`}>{t('settings.deleteEmail')}</p>
                  <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Password" className={`w-full ${inputCls} mb-4 ${dark ? 'bg-slate-600' : 'bg-ab-red/10'} border-ab-red/30`} />
                  <button onClick={() => { triggerToast('Account deletion requested', 'info'); localStorage.clear(); setIsAuthenticated(false); setView('auth-welcome'); }}
                    className="w-full py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                    Confirm Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
