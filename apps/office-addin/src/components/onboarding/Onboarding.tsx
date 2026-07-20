import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { fetchAutoReplyWindow, isGraphAuthenticated } from '../../api/graph';
import { CustomCategory } from '../../api/categorize';
import { User, Settings2, Mail, Bell, HelpCircle, CreditCard, ChevronRight, ChevronLeft, X, Plus, Check, Edit2, Loader2, CalendarSearch, Trash2 } from 'lucide-react';

/* ── Sidebar Navigation ── */
interface SidebarProps { activeView: string; onNav: (v: string) => void; initials: string; dark: boolean; daysLeft: number; t: (k: string) => string; }

const Sidebar = ({ activeView, onNav, initials, dark, daysLeft, t }: SidebarProps) => {
  const items = [
    { id: 'onboard-profile', label: t('onboard.profile'), icon: User, indent: false },
    { id: 'onboard-options', label: t('onboard.options'), icon: Settings2, indent: false, disabled: true },
    { id: 'onboard-before', label: t('onboard.before'), icon: null, indent: true },
    { id: 'onboard-after', label: t('onboard.after'), icon: null, indent: true },
    { id: 'onboard-categories', label: t('onboard.categories'), icon: Mail, indent: false },
    { id: 'sep1', label: '', icon: null, indent: false, separator: true },
    { id: 'settings-general', label: t('onboard.settings'), icon: Settings2, indent: false },
    { id: 'settings-news', label: t('onboard.news'), icon: Bell, indent: false, badge: 2 },
    { id: 'settings-faq', label: t('onboard.faq'), icon: HelpCircle, indent: false },
    { id: 'bill-plans', label: t('onboard.payment'), icon: CreditCard, indent: false },
  ];

  return (
    <div className={`w-48 flex-shrink-0 flex flex-col border-r p-4 ${
      dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full border-2 border-ab-orange flex items-center justify-center text-sm font-bold text-ab-red bg-orange-50 dark:bg-orange-900/20">
          {initials}
        </div>
      </div>
      <nav className="flex-1 space-y-0.5">
        {items.map(item => {
          if (item.separator) return <hr key={item.id} className={`my-3 ${dark ? 'border-slate-700' : 'border-slate-100'}`} />;
          const isActive = activeView === item.id || (item.id === 'onboard-options' && (activeView === 'onboard-before' || activeView === 'onboard-after'));
          return (
            <button key={item.id} onClick={() => !item.disabled && onNav(item.id)}
              className={`w-full text-left flex items-center gap-2 py-1.5 text-[11px] rounded-md transition-all ${
                item.indent ? 'pl-7' : 'pl-2'
              } ${isActive
                ? (dark ? 'text-white font-semibold' : 'text-slate-800 font-semibold')
                : (dark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
              } ${item.disabled ? 'cursor-default' : 'cursor-pointer'}`}>
              {isActive && <span className="text-ab-red font-bold mr-0.5">›</span>}
              {item.icon && <item.icon size={13} />}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">{item.badge}</span>
              )}
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

/* ── Mini Calendar — clickable range selection ── */
const MiniCalendar = ({ selectedStart, selectedEnd, onPick, dark }: {
  selectedStart: string; selectedEnd: string; onPick: (date: string) => void; dark: boolean;
}) => {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (displayDate.getDay() + 6) % 7; // Monday = 0
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const startD = selectedStart ? new Date(selectedStart) : null;
  const endD = selectedEnd ? new Date(selectedEnd) : null;

  const toIso = (day: number) => {
    const m = String(displayDate.getMonth() + 1).padStart(2, '0');
    return `${displayDate.getFullYear()}-${m}-${String(day).padStart(2, '0')}`;
  };

  return (
    <div className={`w-56 rounded-xl border p-3 shadow-ab ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMonthOffset(m => m - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"><ChevronLeft size={14}/></button>
        <span className={`text-xs font-bold ${dark ? 'text-white' : 'text-slate-700'}`}>{monthName}</span>
        <button onClick={() => setMonthOffset(m => m + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"><ChevronRight size={14}/></button>
      </div>
      <div className="calendar-grid">
        {days.map(d => <div key={d} className="calendar-header">{d}</div>)}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toIso(day);
          const date = new Date(dateStr);
          const isSelected = dateStr === selectedStart || dateStr === selectedEnd;
          const isInRange = startD && endD && date > startD && date < endD;
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div key={day} onClick={() => onPick(dateStr)}
              className={`calendar-day ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''} ${isToday ? 'today' : ''}`}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Category Pill ── */
const CategoryPill = ({ label, color, enabled, order, onToggle, onRemove }: {
  label: string; color: string; enabled: boolean; order: number; onToggle: () => void; onRemove?: () => void;
}) => (
  <span className="inline-flex items-center">
    <button onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
        enabled ? `text-white border-transparent` : `text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400`
      } ${onRemove ? 'rounded-r-none' : ''}`}
      style={enabled ? { backgroundColor: color } : {}}>
      {enabled && <Check size={12} />}
      {label}
      {enabled && order > 0 && (
        <span className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[9px] font-bold">{order}</span>
      )}
    </button>
    {onRemove && (
      <button onClick={onRemove}
        className="px-1.5 py-2 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-600 text-slate-400 hover:text-ab-red transition-colors">
        <Trash2 size={11}/>
      </button>
    )}
  </span>
);

/* ── Main Component ── */
export default function Onboarding() {
  const { view, setView, userProfile, setUserProfile, onboarding, setOnboarding, settings, t, triggerToast, trialDaysRemaining } = useApp();
  const dark = settings.darkMode;
  const initials = (userProfile.name[0] || '') + (userProfile.surname[0] || '');

  // Local state for editable fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState({ ...userProfile });
  const [beforeStart, setBeforeStart] = useState(onboarding.absence.beforeAbsenceStart);
  const [beforeEnd, setBeforeEnd] = useState(onboarding.absence.beforeAbsenceEnd);
  const [afterStart, setAfterStart] = useState(onboarding.absence.afterAbsenceStart);
  const [afterEnd, setAfterEnd] = useState(onboarding.absence.afterAbsenceEnd);
  const [autoPopup, setAutoPopup] = useState(onboarding.absence.autoPopup);
  const [oofLoading, setOofLoading] = useState(false);

  const builtinCats: { key: string; color: string }[] = [
    { key: 'highPriority', color: '#EF5B5B' },
    { key: 'customer', color: '#4CAF50' },
    { key: 'supervisor', color: '#E8734A' },
    { key: 'supplier', color: '#64748B' },
    { key: 'newsletter', color: '#26A69A' },
    { key: 'spam', color: '#374151' },
    { key: 'inCC', color: '#2A579A' },
    { key: 'meetings', color: '#1A365D' },
    { key: 'proxy', color: '#7C4DFF' },
    { key: 'complaints', color: '#DC2626' },
    { key: 'tasksForMe', color: '#D97706' },
  ];

  // Category state — initialised from (and persisted to) the store (M3)
  const [cats, setCats] = useState(onboarding.categories);
  const [contacts, setContacts] = useState(onboarding.contacts);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatKeywords, setCustomCatKeywords] = useState('');

  const nextOrder = () => {
    const builtinOrders = builtinCats.map(c => (cats as any)[c.key]?.order || 0);
    const customOrders = cats.custom.map(c => c.order);
    return Math.max(0, ...builtinOrders, ...customOrders) + 1;
  };

  const toggleBuiltin = (key: string) => {
    setCats(prev => {
      const cur = (prev as any)[key] as { enabled: boolean; order: number };
      return { ...prev, [key]: cur.enabled ? { enabled: false, order: 0 } : { enabled: true, order: nextOrder() } };
    });
  };

  const toggleCustom = (key: string) => {
    setCats(prev => ({
      ...prev,
      custom: prev.custom.map(c => c.key === key
        ? { ...c, enabled: !c.enabled, order: c.enabled ? 0 : nextOrder() }
        : c),
    }));
  };

  const removeCustom = (key: string) => {
    setCats(prev => ({ ...prev, custom: prev.custom.filter(c => c.key !== key) }));
  };

  const addCustomCategory = () => {
    const label = customCatName.trim();
    if (!label) return;
    const key = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (cats.custom.some(c => c.key === key)) { triggerToast('Category already exists', 'error'); return; }
    const keywords = customCatKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const cat: CustomCategory = { key, label, keywords: keywords.length ? keywords : [label.toLowerCase()], enabled: true, order: nextOrder() };
    setCats(prev => ({ ...prev, custom: [...prev.custom, cat] }));
    setCustomCatName('');
    setCustomCatKeywords('');
    setView('onboard-categories');
  };

  const saveProfile = () => {
    setUserProfile(localProfile);
    setEditingField(null);
  };

  const saveAbsence = () => {
    setOnboarding(prev => ({
      ...prev,
      absence: { ...prev.absence, beforeAbsenceStart: beforeStart, beforeAbsenceEnd: beforeEnd, afterAbsenceStart: afterStart, afterAbsenceEnd: afterEnd, autoPopup },
    }));
  };

  const saveCategories = () => {
    setOnboarding(prev => ({ ...prev, categories: cats, contacts, completed: true }));
  };

  /** Auto-detect the absence window from Outlook Out-of-Office settings (M2) */
  const detectOOF = async () => {
    if (!isGraphAuthenticated()) {
      triggerToast(t('onboard.oofNotFound'), 'info');
      return;
    }
    setOofLoading(true);
    const oof = await fetchAutoReplyWindow();
    setOofLoading(false);
    if (oof) {
      setBeforeStart(oof.startDate);
      setBeforeEnd(oof.endDate);
      triggerToast(t('onboard.oofFound'), 'success');
    } else {
      triggerToast(t('onboard.oofNotFound'), 'info');
    }
  };

  /** Range pick helper: first click sets start, second sets end */
  const pickRange = (setStart: (v: string) => void, setEnd: (v: string) => void, start: string, end: string) => (date: string) => {
    if (!start || (start && end) || date < start) {
      setStart(date);
      setEnd('');
    } else {
      setEnd(date);
    }
  };

  const cardBg = dark ? 'bg-slate-800' : 'bg-white';
  const textP = dark ? 'text-white' : 'text-slate-800';
  const textS = dark ? 'text-slate-400' : 'text-slate-500';
  const textM = dark ? 'text-slate-500' : 'text-slate-400';
  const inputCls = `px-3 py-2 border border-ab-orange/30 rounded-lg text-xs outline-none ${
    dark ? 'bg-slate-700 text-white focus:border-ab-orange' : 'bg-slate-50 text-slate-700 focus:border-ab-orange focus:bg-white'
  } transition-all`;
  const fieldBg = dark ? 'bg-slate-700' : 'bg-slate-100';

  /* ── Profile Field Row ── */
  const ProfileField = ({ label, field, editable = true }: { label: string; field: keyof typeof localProfile; editable?: boolean }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700">
      <span className={`text-xs font-medium w-28 ${textS}`}>{label}</span>
      {editingField === field ? (
        <div className="flex items-center gap-2 flex-1">
          <input value={localProfile[field]} onChange={e => setLocalProfile(p => ({ ...p, [field]: e.target.value }))}
            className={`${inputCls} flex-1`} autoFocus />
          <button onClick={saveProfile} className="text-ab-green"><Check size={14}/></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-between">
          <span className={`text-xs px-3 py-1.5 rounded-md flex-1 ${fieldBg} ${textS}`}>{localProfile[field]}</span>
          {editable && (
            <button onClick={() => setEditingField(field)} className={`${textM} hover:text-ab-red`}>
              <Edit2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`w-full max-w-[900px] min-h-[520px] rounded-2xl shadow-ab overflow-hidden flex relative border ${
        dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* Close */}
        <button onClick={() => setView('dash-main')} className={`absolute top-4 right-4 z-20 ${textM} hover:text-ab-red`}>
          <X size={18} />
        </button>

        {/* Sidebar */}
        <Sidebar activeView={view} onNav={setView} initials={initials} dark={dark} daysLeft={trialDaysRemaining} t={t} />

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide animate-fade-in">

          {/* ═══ PROFILE ═══ */}
          {(view === 'onboard-profile' || view === 'onboard-profile-edit') && (
            <div>
              {view === 'onboard-profile-edit' && (
                <div className="flex justify-end mb-2">
                  <button onClick={() => setView('dash-main')} className={`text-xs font-medium flex items-center gap-1 ${textS} hover:text-ab-red`}>
                    {t('settings.backMail')} <ChevronRight size={12}/>
                  </button>
                </div>
              )}
              <h1 className={`text-xl font-bold mb-1 ${textP}`}>{t('onboard.profile')}</h1>
              <hr className={`mb-6 ${dark ? 'border-slate-700' : 'border-slate-200'}`} />
              <ProfileField label="Name, Surname" field="name" editable={false} />
              <ProfileField label="Job title" field="jobTitle" />
              <ProfileField label="E-Mail" field="email" />
              <ProfileField label="Phone number" field="phone" />
              <ProfileField label="Mobile phone:" field="mobile" />
              <ProfileField label="Company:" field="company" editable={false} />
              {view === 'onboard-profile' && (
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setView('onboard-before')}
                    className="px-6 py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                    {t('onboard.continue')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ BEFORE ABSENCE ═══ */}
          {view === 'onboard-before' && (
            <div>
              <h1 className={`text-xl font-bold mb-6 ${textP}`}>{t('onboard.beforeTitle')}</h1>
              <div className="flex items-start gap-3 mb-6">
                <div className="w-8 h-8 rounded-full border-2 border-ab-orange flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-ab-orange">1</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textP}`}>{t('onboard.step1')}</p>
                  <p className={`text-[10px] ${textM} mt-1`}>{t('onboard.step1Note')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input type="date" value={beforeStart} onChange={e => setBeforeStart(e.target.value)}
                    className={`${inputCls} w-36`} />
                  <span className={`text-sm ${textM}`}>–</span>
                  <input type="date" value={beforeEnd} onChange={e => setBeforeEnd(e.target.value)}
                    className={`${inputCls} w-36`} />
                </div>
                {/* OOF auto-detection (M2) */}
                <button onClick={detectOOF} disabled={oofLoading} title={t('onboard.detectOOFHint')}
                  className="flex items-center gap-1.5 px-3 py-2 border-2 border-ab-blue text-ab-blue text-[10px] font-bold rounded-lg hover:bg-ab-blue hover:text-white transition-all disabled:opacity-50">
                  {oofLoading ? <Loader2 size={12} className="animate-spin"/> : <CalendarSearch size={12}/>}
                  {t('onboard.detectOOF')}
                </button>
              </div>
              <MiniCalendar selectedStart={beforeStart} selectedEnd={beforeEnd}
                onPick={pickRange(setBeforeStart, setBeforeEnd, beforeStart, beforeEnd)} dark={dark} />
              <div className="mt-6 flex justify-end">
                <button onClick={() => { saveAbsence(); setView('onboard-after'); }}
                  className="px-6 py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                  {t('onboard.continue')}
                </button>
              </div>
            </div>
          )}

          {/* ═══ AFTER ABSENCE ═══ */}
          {view === 'onboard-after' && (
            <div>
              <h1 className={`text-xl font-bold mb-6 ${textP}`}>{t('onboard.afterTitle')}</h1>
              <div className="flex items-start gap-3 mb-6">
                <div className="w-8 h-8 rounded-full border-2 border-ab-orange flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-ab-orange">2</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textP}`}>{t('onboard.step2')}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <input type="date" value={afterStart} onChange={e => setAfterStart(e.target.value)} className={`${inputCls} w-36`} />
                    <span className={textM}>–</span>
                    <input type="date" value={afterEnd} onChange={e => setAfterEnd(e.target.value)} className={`${inputCls} w-36`} />
                  </div>
                </div>
              </div>
              <MiniCalendar selectedStart={afterStart} selectedEnd={afterEnd}
                onPick={pickRange(setAfterStart, setAfterEnd, afterStart, afterEnd)} dark={dark} />
              <div className="flex items-start gap-3 mt-8 mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-ab-orange flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-ab-orange">3</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${textP}`}>{t('onboard.step3')}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div onClick={() => setAutoPopup(!autoPopup)}
                      className={`toggle-switch ${autoPopup ? 'active' : ''}`} />
                    <span className={`text-xs ${textS}`}>{autoPopup ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <p className={`text-[9px] ${textM} mt-3 leading-relaxed`}>{t('onboard.step3Note')}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => { saveAbsence(); setView('onboard-categories'); }}
                  className="px-6 py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                  {t('onboard.continue')}
                </button>
              </div>
            </div>
          )}

          {/* ═══ EMAIL CATEGORIES ═══ */}
          {(view === 'onboard-categories' || view === 'onboard-categories-add') && (
            <div>
              <h1 className={`text-xl font-bold mb-3 ${textP}`}>{t('onboard.catTitle')}</h1>
              <p className={`text-[10px] ${textM} mb-6 leading-relaxed max-w-lg`}>{t('onboard.catDesc')}</p>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 rounded-full border-2 border-ab-orange flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-ab-orange">4</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {builtinCats.map(cat => {
                    const state = (cats as any)[cat.key] as { enabled: boolean; order: number };
                    return (
                      <CategoryPill key={cat.key} label={t(`cat.${cat.key}`)} color={cat.color}
                        enabled={state.enabled} order={state.order}
                        onToggle={() => toggleBuiltin(cat.key)} />
                    );
                  })}
                  {cats.custom.map(cat => (
                    <CategoryPill key={cat.key} label={cat.label} color="#0EA5E9"
                      enabled={cat.enabled} order={cat.order}
                      onToggle={() => toggleCustom(cat.key)} onRemove={() => removeCustom(cat.key)} />
                  ))}
                  <button onClick={() => setView('onboard-categories-add')}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs border border-dashed ${
                      dark ? 'border-slate-600 text-slate-400 hover:border-ab-red' : 'border-slate-300 text-slate-500 hover:border-ab-red'
                    } transition-all`}>
                    <Plus size={12}/> add your category
                  </button>
                </div>
              </div>
              {view === 'onboard-categories-add' && (
                <div className={`ml-11 mb-4 p-3 rounded-lg border ${dark ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
                  <input value={customCatName} onChange={e => setCustomCatName(e.target.value)}
                    placeholder={t('onboard.customName')} className={`${inputCls} w-full mb-2`} autoFocus />
                  <input value={customCatKeywords} onChange={e => setCustomCatKeywords(e.target.value)}
                    placeholder={t('onboard.customKeywords')} className={`${inputCls} w-full mb-2`} />
                  <div className="flex gap-2">
                    <button onClick={addCustomCategory}
                      className="px-4 py-1.5 bg-ab-red text-white text-xs rounded-lg font-semibold">{t('onboard.addCat')}</button>
                    <button onClick={() => setView('onboard-categories')} className={`text-xs ${textM}`}>{t('detail.cancel')}</button>
                  </div>
                </div>
              )}
              {/* Contacts section */}
              <div className="flex items-start gap-3 mt-8">
                <div className="w-8 h-8 rounded-full border-2 border-ab-orange flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-ab-orange">5</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className={`text-sm font-semibold ${textP}`}>{t('onboard.contacts')}</p>
                    <p className={`text-xs ${textS}`}>(customer, supplier etc.)</p>
                    <p className={`text-[9px] ${textM} mt-1`}>{t('onboard.contactsNote')}</p>
                  </div>
                  {(['supervisors', 'customers', 'suppliers'] as const).map(field => (
                    <div key={field} className="flex items-center gap-3">
                      <span className={`text-xs font-medium w-24 capitalize ${textS}`}>{field}</span>
                      <input value={contacts[field]} onChange={e => setContacts(c => ({ ...c, [field]: e.target.value }))}
                        placeholder={t('onboard.pasteEmail')} className={`${inputCls} flex-1`} />
                    </div>
                  ))}
                  <hr className={`my-3 ${dark ? 'border-slate-700' : 'border-slate-200'}`} />
                  <div>
                    <p className={`text-xs font-medium ${textS} mb-2`}>{t('onboard.proxy')}</p>
                    <input value={contacts.proxy} onChange={e => setContacts(c => ({ ...c, proxy: e.target.value }))}
                      placeholder={t('onboard.pasteEmail')} className={`${inputCls} w-full`} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => { saveCategories(); setView('onboard-success'); }}
                  className="px-6 py-2 bg-ab-red text-white text-xs font-bold rounded-lg hover:bg-ab-red-dark transition-all">
                  {t('onboard.save')}
                </button>
              </div>
            </div>
          )}

          {/* ═══ SUCCESS ═══ */}
          {view === 'onboard-success' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] animate-fade-in-up">
              <div className="w-20 h-20 mb-6 flex items-center justify-center">
                <Check size={64} strokeWidth={3} className="text-slate-800 dark:text-white" />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${textP}`}>{t('onboard.success')}</h2>
              <p className={`text-sm ${textS} mb-1`}>{t('onboard.successSub')}</p>
              <p className={`text-sm font-semibold ${textP}`}>{t('onboard.successSub2')}</p>
              <button onClick={() => setView('dash-welcome')}
                className="mt-8 px-8 py-3 bg-ab-red text-white font-bold rounded-xl hover:bg-ab-red-dark transition-all text-sm">
                {t('onboard.goToDash')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
