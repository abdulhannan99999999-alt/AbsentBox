import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useApp } from '../../store/AppContext';
import {
  fetchAbsenceEmails, fetchCalendarEvents, deleteEmail, markEmailReadStatus, moveEmail,
  forwardEmail, replyToEmail, flagEmail, archiveEmail, setOutlookCategory,
  isGraphAuthenticated, CategorizedEmail, GraphCalendarEvent
} from '../../api/graph';
import { categorizeEmails, CustomCategory } from '../../api/categorize';
import { summarizeEmail, detailedSummary, absenceDigest, translateText } from '../../api/ai';
import {
  X, Search, Settings2, MoreVertical, ArrowRight, Plus, LogOut, ChevronLeft, ChevronRight,
  Mail as MailIcon, Calendar as CalIcon, Trash2, Send, Reply, CornerUpRight, Loader2,
  RefreshCw, Flag, Archive, FolderInput, ArrowUpDown, Sparkles, Languages
} from 'lucide-react';

/* ── Demo Fallback Data (only when not authenticated) ── */
const DEMO_EMAILS: CategorizedEmail[] = [
  { id: 'd1', flagged: false, sender: 'Andreas Lange', senderEmail: 'andreas@example.com', initials: 'AL', avatarColor: '#4CAF50', date: '18 May 2026', dateRaw: '2026-05-18', preview: 'Hiermit Bewerbe ich mich als ...', subject: 'Asked for interview', category: 'highPriority', unread: true, body: 'Dear Joe, I wanted to discuss the interview opportunity.', bodyHtml: '', importance: 'high', hasAttachments: false, toRecipients: [], ccRecipients: [], aiSummary: 'VIP sender requesting urgent interview follow-up.', quickAction: 'Answer today', quickActionColor: '#4CAF50' },
  { id: 'd2', flagged: true, sender: 'Sabrina Strab', senderEmail: 'sabrina@example.com', initials: 'SS', avatarColor: '#E8734A', date: '20 May 2026', dateRaw: '2026-05-20', preview: 'Hiermit Bewerbe ich mich als ...', subject: '2nd meeting', category: 'highPriority', unread: true, body: 'Hi, I would like to schedule a second meeting.', bodyHtml: '', importance: 'high', hasAttachments: false, toRecipients: [], ccRecipients: [], aiSummary: 'Follow-up meeting request.', quickAction: 'Plan meeting!', quickActionColor: '#EF5B5B' },
  { id: 'd3', flagged: false, sender: 'Julia Müller', senderEmail: 'julia@example.com', initials: 'JM', avatarColor: '#2A579A', date: '23 May 2026', dateRaw: '2026-05-23', preview: 'Hiermit Bewerbe ich mich als ...', subject: 'Asked for new timeline', category: 'customer', unread: false, body: 'Can we get an updated timeline?', bodyHtml: '', importance: 'normal', hasAttachments: false, toRecipients: [], ccRecipients: [], aiSummary: 'Customer requesting updated timeline.', quickAction: 'Create task', quickActionColor: '#2A579A' },
  { id: 'd4', flagged: false, sender: 'Georg Hanz', senderEmail: 'georg@example.com', initials: 'GH', avatarColor: '#26A69A', date: '04 May 2026', dateRaw: '2026-05-04', preview: 'Personal announcement', subject: 'Personal announcement', category: 'supervisor', unread: false, body: 'Department changes announced.', bodyHtml: '', importance: 'normal', hasAttachments: false, toRecipients: [], ccRecipients: [], aiSummary: 'Supervisor department announcement.' },
  { id: 'd5', flagged: false, sender: 'Lisa Brückner', senderEmail: 'lisa@example.com', initials: 'LB', avatarColor: '#1A365D', date: '10 May 2026', dateRaw: '2026-05-10', preview: 'Meeting agenda', subject: 'New agenda', category: 'meetings', unread: true, body: 'Updated meeting agenda attached.', bodyHtml: '', importance: 'normal', hasAttachments: true, toRecipients: [], ccRecipients: [], aiSummary: 'Meeting agenda update.' },
  { id: 'd6', flagged: false, sender: 'TechCrunch', senderEmail: 'news@techcrunch.com', initials: 'TC', avatarColor: '#06B6D4', date: '20 May 2026', dateRaw: '2026-05-20', preview: 'Top stories this week...', subject: 'Weekly digest', category: 'newsletter', unread: false, body: 'Top tech stories.', bodyHtml: '', importance: 'normal', hasAttachments: false, toRecipients: [], ccRecipients: [], aiSummary: 'Tech newsletter.' },
  { id: 'd7', flagged: false, sender: 'Win A Prize', senderEmail: 'spam@fake.com', initials: 'WP', avatarColor: '#6B7280', date: '19 May 2026', dateRaw: '2026-05-19', preview: 'Congratulations!', subject: 'You won!', category: 'spam', unread: false, body: 'You have been selected.', bodyHtml: '', importance: 'normal', hasAttachments: false, toRecipients: [], ccRecipients: [], aiSummary: 'Spam — prize scam.' },
  { id: 'd8', flagged: false, sender: 'Timo Werner', senderEmail: 'timo@example.com', initials: 'TW', avatarColor: '#D4654A', date: '04 Oct 2026', dateRaw: '2026-10-04', preview: 'New employee joining', subject: 'New employee', category: 'inCC', unread: false, body: 'FYI - new hire next week.', bodyHtml: '', importance: 'normal', hasAttachments: false, toRecipients: [], ccRecipients: [], aiSummary: 'CC notification about new team member.' },
];

/* Category key -> pill CSS class (custom categories fall back to pill-custom) */
const PILL_CLS: Record<string, string> = {
  highPriority: 'pill-high-priority', customer: 'pill-customer', supervisor: 'pill-supervisor',
  inCC: 'pill-in-cc', meetings: 'pill-meetings', uncategorized: 'pill-uncategorized',
  newsletter: 'pill-newsletter', spam: 'pill-spam', supplier: 'pill-supplier',
  complaints: 'pill-complaints', proxy: 'pill-proxy', tasksForMe: 'pill-tasksForMe',
};

const MEETING_COLORS = ['#4CAF50', '#4CAF50', '#2A579A', '#E8734A', '#EF5B5B'];
const TIME_SLOTS = ['8-9', '9-10', '10-11', '11-12', '12-13'];

type SortMode = 'newest' | 'oldest' | 'sender';
type DisplayEmail = CategorizedEmail & { threadCount?: number };

export default function Dashboard() {
  const {
    view, setView, userProfile, settings, t, triggerToast, trialDaysRemaining,
    setIsAuthenticated, onboarding, getAbsenceWindow, manualCategories, setManualCategory,
  } = useApp();
  const dark = settings.darkMode;
  const initials = (userProfile.name[0] || '') + (userProfile.surname[0] || '');

  // State
  const [emails, setEmails] = useState<CategorizedEmail[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GraphCalendarEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState('highPriority');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('newest');
  const [sortMenu, setSortMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ emailId: string; x: number; y: number; moveOpen?: boolean } | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<CategorizedEmail | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [closingDialog, setClosingDialog] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [replyMode, setReplyMode] = useState<{ emailId: string; type: 'reply' | 'forward' } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // AI state
  const [digest, setDigest] = useState<{ text: string; ai: boolean } | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [showDigest, setShowDigest] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, { text: string; ai: boolean }>>({});
  const [detailText, setDetailText] = useState<{ text: string; ai: boolean } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const absenceWindow = useMemo(() => getAbsenceWindow(), [onboarding.absence]);

  /* ── User-configured category pills, in chosen order (M3) ── */
  const categories = useMemo(() => {
    const cats = onboarding.categories;
    const builtin = (Object.keys(cats) as (keyof typeof cats)[])
      .filter(k => k !== 'custom')
      .map(k => ({ key: k as string, label: t(`cat.${k}`), enabled: (cats[k] as any).enabled, order: (cats[k] as any).order }));
    const custom = cats.custom.map((c: CustomCategory) => ({ key: c.key, label: c.label, enabled: c.enabled, order: c.order }));
    const enabled = [...builtin, ...custom].filter(c => c.enabled).sort((a, b) => a.order - b.order);
    // Categories the engine can assign that the user did not enable still need
    // a pill when they hold emails — appended after the user's ordered list.
    const enabledKeys = new Set(enabled.map(c => c.key));
    const withMail = Array.from(new Set(emails.map(e => e.category)))
      .filter(k => !enabledKeys.has(k))
      .map(k => ({ key: k, label: t(`cat.${k}`) !== `cat.${k}` ? t(`cat.${k}`) : k, enabled: false, order: 999 }));
    return [...enabled, ...withMail];
  }, [onboarding.categories, emails, settings.language]);

  // Keep the active pill valid when the category list changes
  useEffect(() => {
    if (categories.length && !categories.some(c => c.key === activeCategory)) {
      setActiveCategory(categories[0].key);
    }
  }, [categories]);

  // Manual overrides live in a ref so moving an email never re-triggers a reload
  const manualCatsRef = useRef(manualCategories);
  useEffect(() => { manualCatsRef.current = manualCategories; }, [manualCategories]);
  const emailsRef = useRef<CategorizedEmail[]>([]);
  useEffect(() => { emailsRef.current = emails; }, [emails]);

  const categorizeConfig = useMemo(() => ({
    userName: `${userProfile.name} ${userProfile.surname}`,
    userEmail: userProfile.email,
    supervisors: onboarding.contacts.supervisors.split(',').map(s => s.trim()).filter(Boolean),
    customers: onboarding.contacts.customers.split(',').map(s => s.trim()).filter(Boolean),
    suppliers: onboarding.contacts.suppliers.split(',').map(s => s.trim()).filter(Boolean),
    proxies: onboarding.contacts.proxy.split(',').map(s => s.trim()).filter(Boolean),
    customCategories: onboarding.categories.custom,
    tasksEnabled: settings.tasksEnabled,
  }), [userProfile.name, userProfile.surname, userProfile.email, onboarding.contacts, onboarding.categories.custom, settings.tasksEnabled]);

  /* ── Global absence digest (M5) — generated once per load, not per action ── */
  const generateDigest = useCallback(async (list: CategorizedEmail[]) => {
    if (!list.length || !settings.summaryEnabled) { setDigest(null); return; }
    setDigestLoading(true);
    const d = await absenceDigest(list, absenceWindow, settings.language);
    setDigest(d);
    setDigestLoading(false);
  }, [absenceWindow, settings.language, settings.summaryEnabled]);

  /* ── Load emails for the absence window (M2) ── */
  const loadEmails = useCallback(async () => {
    let list: CategorizedEmail[];
    if (!isGraphAuthenticated()) {
      list = DEMO_EMAILS.map(e => manualCatsRef.current[e.id] ? { ...e, category: manualCatsRef.current[e.id] } : e);
      setEmails(list);
      setIsLive(false);
    } else {
      setLoading(true);
      try {
        const raw = await fetchAbsenceEmails(absenceWindow.start, absenceWindow.end, 500);
        list = categorizeEmails(raw, { ...categorizeConfig, manualOverrides: manualCatsRef.current });
        setEmails(list);
        setIsLive(true);
        triggerToast(`${raw.length} emails loaded (${absenceWindow.start} → ${absenceWindow.end})`, 'success');
      } catch (err) {
        console.error('Failed to fetch emails:', err);
        list = DEMO_EMAILS;
        setEmails(list);
        setIsLive(false);
        triggerToast('Using demo data — sign in with Microsoft for real emails', 'info');
      }
      setLoading(false);
    }
    generateDigest(list);
  }, [absenceWindow, categorizeConfig, generateDigest]);

  // Fetch calendar events for the visible week (M5)
  const loadCalendar = useCallback(async () => {
    if (!isGraphAuthenticated()) return;
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 5);
      const events = await fetchCalendarEvents(weekStart.toISOString(), weekEnd.toISOString());
      setCalendarEvents(events);
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    }
  }, [weekOffset]);

  useEffect(() => { loadEmails(); }, [loadEmails]);
  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  // Regenerate the digest when language / summary settings change
  useEffect(() => { generateDigest(emailsRef.current); }, [generateDigest]);

  // Category counts (dynamic from real data)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    emails.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [emails]);

  /* ── Filter + sort + optional thread clustering ── */
  const filteredEmails: DisplayEmail[] = useMemo(() => {
    let list: DisplayEmail[] = emails.filter(e => e.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => e.sender.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.preview.toLowerCase().includes(q));
    }
    if (settings.clusteringEnabled) {
      const byThread = new Map<string, DisplayEmail[]>();
      const solo: DisplayEmail[] = [];
      list.forEach(e => {
        if (e.conversationId) {
          const arr = byThread.get(e.conversationId) || [];
          arr.push(e);
          byThread.set(e.conversationId, arr);
        } else solo.push(e);
      });
      list = [...solo];
      byThread.forEach(group => {
        const newest = group.sort((a, b) => b.dateRaw.localeCompare(a.dateRaw))[0];
        list.push(group.length > 1 ? { ...newest, threadCount: group.length } : newest);
      });
    }
    switch (sortBy) {
      case 'newest': list.sort((a, b) => b.dateRaw.localeCompare(a.dateRaw)); break;
      case 'oldest': list.sort((a, b) => a.dateRaw.localeCompare(b.dateRaw)); break;
      case 'sender': list.sort((a, b) => a.sender.localeCompare(b.sender)); break;
    }
    return list;
  }, [emails, activeCategory, searchQuery, sortBy, settings.clusteringEnabled]);

  /* ── Real Email Actions (M4) — all reflected in Outlook when live ── */
  const handleDeleteEmail = async (id: string) => {
    setContextMenu(null);
    setActionLoading(id);
    try {
      if (isLive) await deleteEmail(id);
      setEmails(prev => prev.filter(e => e.id !== id));
      if (selectedEmail?.id === id) setSelectedEmail(null);
      triggerToast('Email deleted from Outlook');
    } catch {
      triggerToast('Failed to delete email', 'error');
    }
    setActionLoading(null);
  };

  const handleMarkRead = async (id: string, read: boolean) => {
    setContextMenu(null);
    try {
      if (isLive) await markEmailReadStatus(id, read);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, unread: !read } : e));
      triggerToast(read ? 'Marked as read' : 'Marked as unread');
    } catch {
      triggerToast('Failed to update read status', 'error');
    }
  };

  const handleFlag = async (id: string, flagged: boolean) => {
    setContextMenu(null);
    try {
      if (isLive) await flagEmail(id, flagged);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, flagged } : e));
      triggerToast(flagged ? 'Flagged in Outlook' : 'Flag removed');
    } catch {
      triggerToast('Failed to update flag', 'error');
    }
  };

  const handleArchive = async (id: string) => {
    setContextMenu(null);
    setActionLoading(id);
    try {
      if (isLive) await archiveEmail(id);
      setEmails(prev => prev.filter(e => e.id !== id));
      if (selectedEmail?.id === id) setSelectedEmail(null);
      triggerToast('Done — archived in Outlook');
    } catch {
      triggerToast('Failed to archive email', 'error');
    }
    setActionLoading(null);
  };

  const handleMoveToJunk = async (id: string) => {
    setContextMenu(null);
    try {
      if (isLive) await moveEmail(id, 'junkemail');
      setEmails(prev => prev.map(e => e.id === id ? { ...e, category: 'spam' } : e));
      triggerToast('Moved to spam');
    } catch {
      triggerToast('Failed to move email', 'error');
    }
  };

  /** Move between Absentbox categories; also labels the mail in Outlook */
  const handleMoveToCategory = async (id: string, categoryKey: string, label: string) => {
    setContextMenu(null);
    setManualCategory(id, categoryKey);
    setEmails(prev => prev.map(e => e.id === id ? { ...e, category: categoryKey } : e));
    try {
      if (isLive) await setOutlookCategory(id, label);
      triggerToast(`Moved to ${label}`);
    } catch {
      triggerToast(`Moved to ${label} (Outlook label failed)`, 'info');
    }
  };

  const handleReply = async (emailId: string) => {
    if (!replyText.trim()) return;
    setActionLoading(emailId);
    try {
      if (isLive) await replyToEmail(emailId, replyText);
      triggerToast('Reply sent via Outlook!', 'success');
      setReplyMode(null);
      setReplyText('');
    } catch {
      triggerToast('Failed to send reply', 'error');
    }
    setActionLoading(null);
  };

  const handleForward = async (emailId: string) => {
    if (!forwardTo.trim()) return;
    setActionLoading(emailId);
    try {
      if (isLive) await forwardEmail(emailId, forwardTo, replyText || undefined);
      triggerToast(`Forwarded to ${forwardTo}!`, 'success');
      setReplyMode(null);
      setReplyText('');
      setForwardTo('');
    } catch {
      triggerToast('Failed to forward email', 'error');
    }
    setActionLoading(null);
  };

  const handleDeleteAll = async () => {
    const toDelete = filteredEmails;
    setLoading(true);
    try {
      if (isLive) {
        for (const email of toDelete) {
          await deleteEmail(email.id);
        }
      }
      setEmails(prev => prev.filter(e => e.category !== activeCategory));
      triggerToast(`${toDelete.length} emails deleted from Outlook`);
    } catch {
      triggerToast('Some emails failed to delete', 'error');
    }
    setLoading(false);
  };

  const toggleSelectEmail = (id: string) => {
    setSelectedEmails(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  /* ── Per-email AI summary, loaded when detail opens (M5) ── */
  const openEmail = (email: CategorizedEmail) => {
    setSelectedEmail(email);
    setDetailText(null);
    setTranslated(null);
    if (settings.summaryEnabled && !summaries[email.id]) {
      summarizeEmail(email, settings.language).then(s =>
        setSummaries(prev => ({ ...prev, [email.id]: s }))
      );
    }
    if (email.unread) handleMarkRead(email.id, true);
  };

  const loadDetail = async (email: CategorizedEmail) => {
    setDetailLoading(true);
    setDetailText(await detailedSummary(email, settings.language));
    setDetailLoading(false);
  };

  const handleTranslate = async (email: CategorizedEmail) => {
    setTranslating(true);
    const bodyText = email.bodyHtml || email.body;
    const result = await translateText(bodyText.replace(/<[^>]+>/g, ' ').substring(0, 4000), settings.language);
    setTranslating(false);
    if (result) setTranslated(result);
    else triggerToast('Translation requires the AI backend (see Settings)', 'info');
  };

  const cardBg = dark ? 'bg-slate-800' : 'bg-white';
  const textP = dark ? 'text-white' : 'text-slate-800';
  const textS = dark ? 'text-slate-400' : 'text-slate-500';
  const textM = dark ? 'text-slate-500' : 'text-slate-400';
  const borderC = dark ? 'border-slate-700' : 'border-slate-200';
  const inputCls = `px-3 py-2 border rounded-lg text-xs outline-none ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'} focus:border-ab-orange transition-all`;

  /* ── Slide-out Sidebar ── */
  const SideMenu = () => (
    <div className={`fixed inset-0 z-50 ${showSidebar ? '' : 'pointer-events-none'}`}>
      {showSidebar && <div className="absolute inset-0 bg-black/40" onClick={() => setShowSidebar(false)} />}
      <div className={`absolute left-0 top-0 bottom-0 w-64 ${dark ? 'bg-slate-800' : 'bg-white'} shadow-ab-lg transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full'} flex flex-col p-6`}>
        <div className="flex items-center gap-3 mb-8">
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-ab-orange object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-ab-orange flex items-center justify-center text-sm font-bold text-ab-red bg-orange-50 dark:bg-orange-900/20">{initials}</div>
          )}
          <div>
            <p className={`text-sm font-bold ${textP}`}>{userProfile.name} {userProfile.surname}</p>
            <p className={`text-[10px] ${textM}`}>{userProfile.email}</p>
          </div>
        </div>
        <div className={`text-[9px] px-2 py-1 rounded-full mb-4 text-center font-semibold ${isLive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
          {isLive ? `🟢 ${t('dash.live')}` : `🟡 ${t('dash.demo')}`}
        </div>
        <nav className="flex-1 space-y-1">
          {[
            { label: t('sidebar.mail'), icon: MailIcon, action: () => { setShowSidebar(false); setView('dash-main'); } },
            { label: t('dash.refresh'), icon: RefreshCw, action: () => { setShowSidebar(false); loadEmails(); } },
            { label: t('sidebar.onboarding'), icon: Settings2, action: () => { setShowSidebar(false); setView('onboard-profile-edit'); } },
            { label: t('sidebar.settings'), icon: Settings2, action: () => { setShowSidebar(false); setView('settings-general'); } },
            { label: t('sidebar.payment'), icon: CalIcon, action: () => { setShowSidebar(false); setView('bill-plans'); } },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className={`w-full text-left flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs ${textS} hover:bg-slate-100 dark:hover:bg-slate-700 transition-all`}>
              <item.icon size={15}/> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { setShowSidebar(false); setIsAuthenticated(false); setView('auth-welcome'); }}
          className="flex items-center gap-3 py-2.5 px-3 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all mt-4">
          <LogOut size={15}/> {t('sidebar.signout')}
        </button>
      </div>
    </div>
  );

  /* ── Email Detail Overlay ── */
  const EmailDetail = ({ email }: { email: CategorizedEmail }) => {
    const summary = summaries[email.id];
    return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={() => { setSelectedEmail(null); setReplyMode(null); }}>
      <div className="outlook-window w-full max-w-2xl max-h-[85vh] overflow-hidden animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="outlook-titlebar">
          <div className="outlook-dot" style={{ background: '#FF5F57' }}/><div className="outlook-dot" style={{ background: '#FFBD2E' }}/><div className="outlook-dot" style={{ background: '#28C840' }}/>
          <span className="text-[10px] text-slate-500 ml-3 flex-1 truncate">{email.subject} - Message (HTML)</span>
          <button onClick={() => { setSelectedEmail(null); setReplyMode(null); }} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
        </div>
        <div className={`text-[9px] ${dark ? 'bg-slate-700' : 'bg-slate-100'} px-3 py-1.5 flex gap-4 border-b ${borderC}`}>
          {['File', 'Message', 'Insert', 'Options', 'Format Text', 'Review', 'Help'].map(tab => <span key={tab} className={textS}>{tab}</span>)}
        </div>
        <div className={`p-5 ${dark ? 'bg-slate-800' : 'bg-white'} overflow-y-auto flex-1`}>
          <div className={`text-xs space-y-1 mb-4 pb-3 border-b ${borderC}`}>
            <p><strong className={textP}>From:</strong> <span className={textS}>{email.sender} ({email.senderEmail})</span></p>
            <p><strong className={textP}>Subject:</strong> <span className={textS}>{email.subject}</span></p>
            {email.toRecipients.length > 0 && <p><strong className={textP}>To:</strong> <span className={textS}>{email.toRecipients.join(', ')}</span></p>}
            {email.ccRecipients.length > 0 && <p><strong className={textP}>CC:</strong> <span className={textS}>{email.ccRecipients.join(', ')}</span></p>}
            <p><strong className={textP}>Date:</strong> <span className={textS}>{email.date}</span></p>
            {email.hasAttachments && <p className="text-ab-orange text-[10px] font-semibold">📎 {t('detail.attachments')}</p>}
          </div>
          {translated ? (
            <div className={`text-xs leading-relaxed whitespace-pre-wrap ${textS}`}>
              <p className="text-[9px] font-bold text-ab-blue mb-2 flex items-center gap-1"><Languages size={10}/> {t('detail.translate')}:</p>
              {translated}
            </div>
          ) : email.bodyHtml && email.bodyHtml !== email.body ? (
            <div className={`text-xs leading-relaxed ${textS}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.bodyHtml) }} />
          ) : (
            <div className={`text-xs leading-relaxed whitespace-pre-wrap ${textS}`}>{email.body}</div>
          )}
          {/* AI Analysis (M5) */}
          {settings.summaryEnabled && (
            <div className={`mt-6 p-4 rounded-lg border ${dark ? 'border-ab-blue/30 bg-ab-blue/10' : 'border-blue-100 bg-blue-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-ab-blue flex items-center gap-1"><Sparkles size={11}/> {t('detail.aiAnalysis')}</p>
                {summary && (
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${summary.ai ? 'bg-ab-blue text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
                    {summary.ai ? t('dash.digest.aiBadge') : t('dash.digest.localBadge')}
                  </span>
                )}
              </div>
              <p className={`text-[10px] leading-relaxed ${textS}`}>
                {summary ? summary.text : email.aiSummary}
              </p>
              {detailText && (
                <div className={`mt-3 pt-3 border-t ${dark ? 'border-ab-blue/30' : 'border-blue-100'}`}>
                  <p className="text-[9px] font-bold text-ab-blue mb-1">{t('detail.deepAnalysis')}</p>
                  <p className={`text-[10px] leading-relaxed whitespace-pre-wrap ${textS}`}>{detailText.text}</p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {!detailText && (
                  <button onClick={() => loadDetail(email)} disabled={detailLoading}
                    className="text-[9px] font-semibold text-ab-blue hover:underline flex items-center gap-1 disabled:opacity-50">
                    {detailLoading ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} {t('detail.deepAnalysis')}
                  </button>
                )}
                {!translated && (
                  <button onClick={() => handleTranslate(email)} disabled={translating}
                    className="text-[9px] font-semibold text-ab-blue hover:underline flex items-center gap-1 disabled:opacity-50">
                    {translating ? <Loader2 size={10} className="animate-spin"/> : <Languages size={10}/>} {t('detail.translate')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Action bar */}
        <div className={`flex items-center gap-2 px-4 py-3 border-t ${borderC} flex-shrink-0`}>
          <button onClick={() => { setReplyMode({ emailId: email.id, type: 'reply' }); setReplyText(''); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-ab-blue text-white text-[10px] font-semibold rounded-lg hover:bg-ab-blue-light transition-all">
            <Reply size={12}/> {t('detail.reply')}
          </button>
          <button onClick={() => { setReplyMode({ emailId: email.id, type: 'forward' }); setReplyText(''); setForwardTo(''); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-ab-orange text-white text-[10px] font-semibold rounded-lg hover:opacity-90 transition-all">
            <CornerUpRight size={12}/> {t('detail.forward')}
          </button>
          <button onClick={() => handleFlag(email.id, !email.flagged)}
            className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-all border ${email.flagged ? 'bg-ab-red text-white border-ab-red' : `${borderC} ${textS} hover:border-ab-red hover:text-ab-red`}`}>
            <Flag size={12}/> {email.flagged ? t('dash.context.unflag') : t('dash.context.flag')}
          </button>
          <button onClick={() => handleArchive(email.id)}
            className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-all border ${borderC} ${textS} hover:border-ab-green hover:text-ab-green`}>
            <Archive size={12}/> Done
          </button>
          <button onClick={() => handleDeleteEmail(email.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-ab-red text-white text-[10px] font-semibold rounded-lg hover:bg-ab-red-dark transition-all ml-auto">
            {actionLoading === email.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>} {t('detail.delete')}
          </button>
        </div>
        {/* Reply/Forward panel */}
        {replyMode && replyMode.emailId === email.id && (
          <div className={`px-4 pb-4 border-t ${borderC} animate-fade-in flex-shrink-0`}>
            {replyMode.type === 'forward' && (
              <input value={forwardTo} onChange={e => setForwardTo(e.target.value)}
                placeholder={t('detail.forwardPlaceholder')} className={`w-full ${inputCls} mt-3 mb-2`} />
            )}
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder={replyMode.type === 'reply' ? t('detail.replyPlaceholder') : t('detail.commentPlaceholder')}
              className={`w-full ${inputCls} mt-2 h-20 resize-none`} />
            <div className="flex gap-2 mt-2">
              <button onClick={() => replyMode.type === 'reply' ? handleReply(email.id) : handleForward(email.id)}
                disabled={actionLoading === email.id}
                className="flex items-center gap-1 px-4 py-1.5 bg-ab-green text-white text-[10px] font-bold rounded-lg hover:bg-ab-green-dark transition-all disabled:opacity-50">
                {actionLoading === email.id ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
                {replyMode.type === 'reply' ? t('detail.sendReply') : t('detail.forward')}
              </button>
              <button onClick={() => setReplyMode(null)} className={`text-[10px] ${textM}`}>{t('detail.cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  /* ── Closing Dialog ── */
  const ClosingDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`auth-card p-8 max-w-sm text-center animate-scale-in ${cardBg}`}>
        <p className={`text-sm font-semibold mb-6 ${textP}`}>{t('dash.close.title')}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => { setClosingDialog(false); triggerToast('Absentbox will open on next start', 'success'); }}
            className="px-8 py-2 rounded-full border-2 border-ab-green text-ab-green text-xs font-bold hover:bg-ab-green hover:text-white transition-all">{t('dash.close.yes')}</button>
          <button onClick={() => { setClosingDialog(false); triggerToast('Absentbox will not auto-open', 'info'); }}
            className="px-8 py-2 rounded-full border-2 border-ab-red text-ab-red text-xs font-bold hover:bg-ab-red hover:text-white transition-all">{t('dash.close.no')}</button>
        </div>
      </div>
    </div>
  );

  /* ── Meeting Calendar Grid (M5) ── */
  const MeetingCalendar = () => {
    const dayNames = settings.language === 'de' ? ['Mo', 'Di', 'Mi', 'Do', 'Fr'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const eventBlocks = calendarEvents.map(ev => {
      const start = new Date(ev.start.dateTime.endsWith('Z') ? ev.start.dateTime : ev.start.dateTime + 'Z');
      const end = new Date(ev.end.dateTime.endsWith('Z') ? ev.end.dateTime : ev.end.dateTime + 'Z');
      const day = (start.getDay() + 6) % 7; // Mon=0
      const slotIdx = Math.max(0, start.getHours() - 8);
      const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 3600000));
      return { day, slot: slotIdx, span: duration, label: ev.subject, color: MEETING_COLORS[day % 5] || '#2A579A' };
    }).filter(b => b.day >= 0 && b.day < 5 && b.slot >= 0 && b.slot < 5);

    return (
      <div className={`mt-4 border rounded-lg overflow-hidden ${borderC}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className={`${textM} hover:text-ab-red`}><ChevronLeft size={14}/></button>
          <span className={`text-xs font-bold ${textP}`}>{isLive && calendarEvents.length > 0 ? `${calendarEvents.length} meetings` : `Week ${weekOffset >= 0 ? `+${weekOffset}` : weekOffset}`}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className={`${textM} hover:text-ab-red`}><ChevronRight size={14}/></button>
        </div>
        <div className="meeting-grid">
          <div className="meeting-time" />
          {dayNames.map((day, i) => <div key={day} className="meeting-header" style={{ backgroundColor: MEETING_COLORS[i] }}>{day}</div>)}
          {TIME_SLOTS.map((slot, si) => (
            <React.Fragment key={slot}>
              <div className="meeting-time">{slot}</div>
              {dayNames.map((_, di) => {
                const block = eventBlocks.find(b => b.day === di && b.slot === si);
                return (
                  <div key={`${si}-${di}`} className="meeting-cell">
                    {block && <div className="meeting-block" style={{ backgroundColor: block.color, minHeight: block.span > 1 ? `${block.span * 40}px` : undefined }}>{block.label}</div>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  /* ── Welcome Back View ── */
  if (view === 'dash-welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-[800px] rounded-2xl shadow-ab overflow-hidden flex ${cardBg} border ${borderC} animate-fade-in-up`}>
          <div className={`flex-1 p-10 flex items-center justify-center ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <img src="/logo.jpeg" alt="Absentbox" className="w-40 rounded-xl animate-float" />
          </div>
          <div className="flex-1 p-10 flex flex-col justify-center">
            <div className="space-y-4">
              <h1 className={`text-xl font-bold ${textP}`}>{t('dash.welcome.title')} {userProfile.name}!</h1>
              <p className={`text-sm ${textS}`}>{t('dash.welcome.sub')}</p>
              <p className={`text-sm ${textS}`}>{t('dash.welcome.sorting')}</p>
              <p className={`text-[10px] ${textM}`}>{t('dash.absencePeriod')}: {absenceWindow.start} → {absenceWindow.end}</p>
              <button onClick={() => setView('dash-main')}
                className={`flex items-center gap-2 text-sm font-bold mt-4 ${textP} hover:text-ab-red group transition-colors`}>
                {t('dash.welcome.ready')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Email Row Renderer ── */
  const renderEmailRow = (email: DisplayEmail, idx: number) => (
    <div key={email.id}
      className={`flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 ${borderC} animate-fade-in ${actionLoading === email.id ? 'opacity-50' : ''}`}
      style={{ animationDelay: `${Math.min(idx, 15) * 30}ms` }}
      onClick={() => openEmail(email)}>
      <input type="checkbox" checked={selectedEmails.has(email.id)}
        onChange={() => toggleSelectEmail(email.id)} onClick={e => e.stopPropagation()} className="flex-shrink-0 rounded" />
      {email.unread ? <div className="w-2 h-2 rounded-full bg-ab-blue flex-shrink-0" /> : <div className="w-2 h-2 flex-shrink-0" />}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: email.avatarColor }}>{email.initials}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold truncate ${textP}`}>{email.sender}</span>
          {email.flagged && <Flag size={9} className="text-ab-red flex-shrink-0" fill="currentColor"/>}
          {email.threadCount && email.threadCount > 1 && (
            <span className="text-[8px] px-1.5 rounded-full bg-ab-blue/15 text-ab-blue font-bold flex-shrink-0">×{email.threadCount}</span>
          )}
          <span className={`text-[9px] ${textM}`}>◉ {email.date}</span>
          {email.hasAttachments && <span className="text-[8px]">📎</span>}
        </div>
        <p className={`text-[10px] truncate ${textM}`}>{email.preview}</p>
      </div>
      {showQuickActions && email.quickAction ? (
        <span className="px-2 py-1 rounded-full text-[9px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: email.quickActionColor }}>{email.quickAction}</span>
      ) : (
        <span className={`text-[10px] text-right max-w-[140px] flex-shrink-0 ${textS}`}>{email.subject}</span>
      )}
      <button onClick={e => { e.stopPropagation(); setContextMenu({ emailId: email.id, x: e.clientX, y: e.clientY }); }}
        className={`flex-shrink-0 ${textM} hover:text-ab-red`}><MoreVertical size={14} /></button>
    </div>
  );

  const contextEmail = contextMenu ? emails.find(e => e.id === contextMenu.emailId) : null;

  /* ── Main Dashboard ── */
  return (
    <div className="min-h-screen flex items-center justify-center p-2 md:p-4">
      <div className={`w-full max-w-[1000px] min-h-[550px] rounded-2xl shadow-ab overflow-hidden flex flex-col ${cardBg} border ${borderC} relative`}>
        <SideMenu />
        {selectedEmail && <EmailDetail email={emails.find(e => e.id === selectedEmail.id) || selectedEmail} />}
        {closingDialog && <ClosingDialog />}

        {/* Top Bar */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${borderC}`}>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="" onClick={() => setShowSidebar(true)}
                className="w-10 h-10 rounded-full border-2 border-ab-orange object-cover cursor-pointer" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-ab-orange flex items-center justify-center text-sm font-bold text-ab-red bg-orange-50 dark:bg-orange-900/20 cursor-pointer"
                onClick={() => setShowSidebar(true)}>{initials}</div>
            )}
            <button onClick={() => setView('settings-general')} className={`text-[8px] ${textM} hover:text-ab-red`}>{t('dash.profile')}</button>
          </div>
          <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {categories.map(cat => (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setShowQuickActions(false); }}
                className={`${PILL_CLS[cat.key] || 'pill-custom'} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat.key ? 'ring-2 ring-offset-1 ring-slate-400 scale-105' : 'opacity-80 hover:opacity-100'
                }`}>
                <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[9px] font-bold">{categoryCounts[cat.key] || 0}</span>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live data"/>}
            <button onClick={() => setClosingDialog(true)} className={`${textM} hover:text-ab-red`}><X size={18}/></button>
          </div>
        </div>

        {/* Absence Digest Banner (M5) */}
        {settings.summaryEnabled && showDigest && (digest || digestLoading) && (
          <div className={`px-4 py-3 border-b ${borderC} ${dark ? 'bg-ab-blue/10' : 'bg-blue-50/60'} animate-fade-in`}>
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="text-ab-blue flex-shrink-0 mt-0.5"/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-bold text-ab-blue">{t('dash.digest.title')}</p>
                  <span className={`text-[8px] ${textM}`}>{absenceWindow.start} → {absenceWindow.end}</span>
                  {digest && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${digest.ai ? 'bg-ab-blue text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
                      {digest.ai ? t('dash.digest.aiBadge') : t('dash.digest.localBadge')}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] leading-relaxed ${textS}`}>
                  {digestLoading ? t('dash.digest.generating') : digest?.text}
                </p>
              </div>
              <button onClick={() => setShowDigest(false)} className={`${textM} hover:text-ab-red flex-shrink-0`}><X size={12}/></button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div className={`w-28 flex-shrink-0 flex flex-col items-center py-6 px-3 border-r ${borderC} gap-4`}>
            <p className={`text-[8px] text-center leading-tight ${textM}`}>{t('dash.total')}</p>
            <div className="w-16 h-16 rounded-full border-[3px] border-ab-orange flex items-center justify-center animate-pulse-ring">
              <span className={`text-xl font-bold ${textP}`}>{emails.filter(e => e.unread).length}</span>
            </div>
            <div className="space-y-2 w-full">
              {[
                { label: t('dash.answer'), action: () => setShowQuickActions(true) },
                { label: t('dash.forward'), action: () => setShowQuickActions(true) },
                { label: t('dash.meeting'), action: () => setShowQuickActions(true) },
                { label: t('dash.delegate'), action: () => setShowQuickActions(true) },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className={`w-full text-left text-[10px] font-semibold py-1 ${textP} hover:text-ab-red transition-colors`}>
                  {item.label}
                </button>
              ))}
              <button onClick={() => setView('onboard-categories')} className={`flex items-center gap-1 text-[10px] ${textM} mt-2 hover:text-ab-red`}>
                <Plus size={10}/> {t('dash.addLabel')}
              </button>
            </div>
            <button onClick={loadEmails} disabled={loading}
              className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-lg border ${borderC} ${textM} hover:text-ab-red transition-all mt-2`}>
              <RefreshCw size={10} className={loading ? 'animate-spin' : ''}/> {t('dash.refresh')}
            </button>
            <div className="mt-auto flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full border-2 border-ab-orange flex items-center justify-center">
                <span className="text-[8px] font-bold text-ab-red">{trialDaysRemaining}</span>
              </div>
              <span className={`text-[8px] ${textM} whitespace-pre-line`}>{t('dash.daysRemain')}</span>
            </div>
          </div>

          {/* Email list */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${borderC}`}>
              <div className="flex items-center gap-2 flex-1">
                <Search size={12} className={textM}/>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search emails..." className={`text-[10px] bg-transparent outline-none flex-1 ${textP}`} />
              </div>
              {/* Sort control (M4) */}
              <div className="relative">
                <button onClick={() => setSortMenu(!sortMenu)}
                  className={`flex items-center gap-1 text-[9px] font-semibold ${textM} hover:text-ab-red transition-colors`}>
                  <ArrowUpDown size={11}/>
                  {sortBy === 'newest' ? t('dash.sortNewest') : sortBy === 'oldest' ? t('dash.sortOldest') : t('dash.sortSender')}
                </button>
                {sortMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setSortMenu(false)} />
                    <div className={`absolute right-0 top-full mt-1 z-30 ${dark ? 'bg-slate-700' : 'bg-white'} rounded-lg shadow-ab-lg border ${borderC} py-1 min-w-[130px]`}>
                      {([['newest', t('dash.sortNewest')], ['oldest', t('dash.sortOldest')], ['sender', t('dash.sortSender')]] as [SortMode, string][]).map(([mode, label]) => (
                        <button key={mode} onClick={() => { setSortBy(mode); setSortMenu(false); }}
                          className={`w-full text-left px-3 py-1.5 text-[10px] ${sortBy === mode ? 'text-ab-red font-bold' : textS} hover:bg-slate-100 dark:hover:bg-slate-600`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {showQuickActions && (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-ab-red/10 text-ab-red">
                  {selectedEmails.size} x
                </span>
              )}
              <span className={`text-sm font-bold ${textP}`}>
                {categories.find(c => c.key === activeCategory)?.label}
              </span>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-3">
                <Loader2 size={24} className={`animate-spin ${textM}`}/>
                <span className={`text-xs ${textM}`}>{t('dash.loading')}</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredEmails.length === 0 ? (
                  <div className={`flex items-center justify-center h-32 text-xs ${textM}`}>{t('dash.noEmails')}</div>
                ) : (
                  filteredEmails.map((email, idx) => renderEmailRow(email, idx))
                )}
              </div>
            )}

            {activeCategory === 'meetings' && <MeetingCalendar />}

            <div className={`px-4 py-2 border-t ${borderC} flex items-center justify-between`}>
              <p className={`text-[8px] flex-1 ${textM}`}>
                {activeCategory === 'newsletter' || activeCategory === 'spam'
                  ? '***Delete / move to other category / mark not as spam and choose which category it belongs to'
                  : activeCategory === 'meetings'
                  ? '*Delete / accept / temporarily / decline / forward to'
                  : '*Delete / move to other category / mark as spam / flag / mark as done'}
              </p>
              {(activeCategory === 'newsletter' || activeCategory === 'spam') && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${activeCategory === 'newsletter' ? 'bg-teal-500' : 'bg-gray-600'}`}>
                    {filteredEmails.length}
                  </span>
                  <button onClick={handleDeleteAll} disabled={loading}
                    className="px-4 py-1.5 bg-ab-red text-white text-[10px] font-bold rounded-lg hover:bg-ab-red-dark transition-all flex items-center gap-1 disabled:opacity-50">
                    {loading ? <Loader2 size={11} className="animate-spin"/> : <Trash2 size={11}/>} {t('dash.deleteAll')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Context Menu (M4: full action set) */}
        {contextMenu && contextEmail && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setContextMenu(null)} />
            <div className={`fixed z-40 ${dark ? 'bg-slate-700' : 'bg-white'} rounded-lg shadow-ab-lg border ${borderC} py-1 animate-scale-in min-w-[200px]`}
              style={{ left: Math.min(contextMenu.x, window.innerWidth - 220), top: Math.min(contextMenu.y, window.innerHeight - 280) }}>
              <button onClick={() => handleMarkRead(contextMenu.emailId, contextEmail.unread)}
                className={`w-full text-left px-4 py-2 text-xs ${textS} hover:bg-slate-100 dark:hover:bg-slate-600 transition-all`}>
                {contextEmail.unread ? t('dash.context.read') : t('dash.context.unread')}
              </button>
              <button onClick={() => handleFlag(contextMenu.emailId, !contextEmail.flagged)}
                className={`w-full text-left px-4 py-2 text-xs ${textS} hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center gap-2`}>
                <Flag size={11}/> {contextEmail.flagged ? t('dash.context.unflag') : t('dash.context.flag')}
              </button>
              <button onClick={() => handleArchive(contextMenu.emailId)}
                className={`w-full text-left px-4 py-2 text-xs ${textS} hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center gap-2`}>
                <Archive size={11}/> {t('dash.context.done')}
              </button>
              {/* Move to category submenu */}
              <button onClick={() => setContextMenu(cm => cm ? { ...cm, moveOpen: !cm.moveOpen } : cm)}
                className={`w-full text-left px-4 py-2 text-xs ${textS} hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center gap-2`}>
                <FolderInput size={11}/> {t('dash.context.move')} {contextMenu.moveOpen ? '▾' : '▸'}
              </button>
              {contextMenu.moveOpen && (
                <div className={`max-h-40 overflow-y-auto border-y ${borderC}`}>
                  {categories.filter(c => c.key !== contextEmail.category).map(c => (
                    <button key={c.key} onClick={() => handleMoveToCategory(contextMenu.emailId, c.key, c.label)}
                      className={`w-full text-left pl-10 pr-4 py-1.5 text-[11px] ${textS} hover:bg-slate-100 dark:hover:bg-slate-600 transition-all`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => handleMoveToJunk(contextMenu.emailId)}
                className={`w-full text-left px-4 py-2 text-xs ${textS} hover:bg-slate-100 dark:hover:bg-slate-600 transition-all`}>
                {t('dash.context.spam')}
              </button>
              <button onClick={() => handleDeleteEmail(contextMenu.emailId)}
                className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                {t('dash.context.delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
