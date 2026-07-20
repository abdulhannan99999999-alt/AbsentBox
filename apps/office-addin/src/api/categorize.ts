import { GraphEmail, CategorizedEmail } from './graph';

/* ── Categorization Engine (M3) ──
 * Multi-stage "Logic-First" pipeline per the Absentbox handbook:
 * 1. Manual overrides (user moved an email between categories)
 * 2. Relationship analysis (VIP supervisors / customers / suppliers / proxy)
 * 3. Heuristic content filters (complaints, meetings, spam, newsletter)
 * 4. Tasks-for-Me extraction (imperative sentences addressed to the user)
 * Every decision is deterministic and auditable — AI enriches, never overrides.
 */

export interface CustomCategory {
  key: string;
  label: string;
  keywords: string[];
  enabled: boolean;
  order: number;
}

export interface CategorizeConfig {
  userName: string;
  userEmail: string;
  supervisors: string[];
  customers: string[];
  suppliers: string[];
  proxies: string[];
  customCategories: CustomCategory[];
  tasksEnabled: boolean;
  /** emailId -> category key, set when the user manually re-categorizes */
  manualOverrides: Record<string, string>;
}

const SPAM_KEYWORDS = ['unsubscribe now', 'lottery', 'winner', 'prize', 'congratulations you', 'million dollars', 'act now', 'limited time offer', 'click here to claim', 'free money', 'crypto invest', 'gewinnspiel', 'sie haben gewonnen'];
const NEWSLETTER_KEYWORDS = ['newsletter', 'digest', 'weekly update', 'monthly roundup', 'unsubscribe', 'manage preferences', 'view in browser', 'mailing list', 'abmelden', 'newsletter abbestellen'];
const NEWSLETTER_SENDERS = ['noreply', 'no-reply', 'news@', 'newsletter@', 'updates@', 'marketing@', 'digest@', 'notification@', 'notifications@'];
const MEETING_KEYWORDS = ['meeting', 'invitation', 'invite', 'calendar', 'accepted:', 'declined:', 'tentative:', 'agenda', 'zoom', 'teams meeting', 'google meet', 'webex', 'termin', 'besprechung', 'einladung'];
const COMPLAINT_KEYWORDS = ['complaint', 'complain', 'unacceptable', 'disappointed', 'dissatisfied', 'refund', 'escalate', 'escalation', 'not working as promised', 'beschwerde', 'reklamation', 'unzufrieden', 'mangel'];
const TASK_PATTERNS = [
  /please (review|send|check|update|prepare|confirm|approve|complete|provide|share|sign)/,
  /could you (please )?/, /can you (please )?/, /would you (please )?/,
  /kindly /, /action required/, /your (approval|input|feedback|review) (is )?(needed|required)/,
  /bitte (prüfe|sende|schicke|überprüfe|bestätige|erledige|bearbeite)/,
  /kannst du /, /könntest du /, /bis (montag|dienstag|mittwoch|donnerstag|freitag)/,
  /by (monday|tuesday|wednesday|thursday|friday|eod|end of (day|week))/,
  /deadline/, /asap/, /to-?do/,
];

const AVATAR_COLORS = ['#4CAF50', '#E8734A', '#2A579A', '#7C4DFF', '#26A69A', '#D4654A', '#1A365D', '#DC2626', '#059669', '#D97706', '#0EA5E9', '#8B5CF6', '#F59E0B', '#06B6D4'];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  const parts = name.split(/[\s.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return '??';
}

export function formatDate(dateStr: string, locale: string = 'en'): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function parseList(raw: string[]): string[] {
  return raw.map(e => e.toLowerCase().trim()).filter(Boolean);
}

function matchesSender(senderEmail: string, list: string[]): boolean {
  return list.some(v => senderEmail.includes(v));
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

/** Detect "task for me": imperative phrasing AND the user is directly addressed */
function isTaskForMe(email: GraphEmail, userEmail: string, userName: string, combined: string): boolean {
  const directlyTo = (email.toRecipients || []).some(
    r => r.emailAddress?.address?.toLowerCase() === userEmail.toLowerCase()
  );
  if (!directlyTo) return false;
  const hasImperative = TASK_PATTERNS.some(p => p.test(combined));
  if (!hasImperative) return false;
  // Name mention strengthens the match but isn't required for direct-to mails
  const firstName = userName.split(' ')[0]?.toLowerCase();
  return hasImperative || (firstName ? combined.includes(firstName) : false);
}

/** Build a heuristic fallback summary (used until/unless AI enriches it) */
function heuristicSummary(email: GraphEmail, senderName: string, category: string): string {
  let s = '';
  if (email.importance === 'high') s = `High priority email from ${senderName}. `;
  if (email.hasAttachments) s += 'Contains attachments. ';
  if (category === 'spam') s += 'Detected as potential spam — review carefully.';
  else if (category === 'newsletter') s += 'Identified as newsletter/promotional content.';
  else if (category === 'meetings') s += `Meeting-related email from ${senderName}.`;
  else if (category === 'complaints') s += `Possible complaint from ${senderName} — needs attention.`;
  else if (category === 'tasksForMe') s += `Contains an action item addressed to you.`;
  else s += `Email from ${senderName} regarding: ${(email.subject || '').substring(0, 60)}.`;
  return s.trim();
}

const QUICK_ACTIONS: Record<string, { label: string; color: string }> = {
  supervisor: { label: 'Answer today', color: '#4CAF50' },
  highPriority: { label: 'Answer today', color: '#4CAF50' },
  customer: { label: 'Create task', color: '#2A579A' },
  complaints: { label: 'Answer today', color: '#DC2626' },
  meetings: { label: 'Plan meeting!', color: '#EF5B5B' },
  tasksForMe: { label: 'Create task', color: '#7C4DFF' },
};

export function categorizeEmails(emails: GraphEmail[], config: CategorizeConfig): CategorizedEmail[] {
  const supervisors = parseList(config.supervisors);
  const customers = parseList(config.customers);
  const suppliers = parseList(config.suppliers);
  const proxies = parseList(config.proxies);
  const customCats = config.customCategories.filter(c => c.enabled && c.keywords.length > 0);

  return emails.map(email => {
    const senderName = email.from?.emailAddress?.name || 'Unknown';
    const senderEmail = (email.from?.emailAddress?.address || '').toLowerCase();
    const subjectLower = (email.subject || '').toLowerCase();
    const previewLower = (email.bodyPreview || '').toLowerCase();
    const combined = subjectLower + ' ' + previewLower;
    const isCC = (email.ccRecipients || []).some(
      r => r.emailAddress?.address?.toLowerCase() === config.userEmail.toLowerCase()
    );

    let category: string;

    if (config.manualOverrides[email.id]) {
      category = config.manualOverrides[email.id];
    } else if (matchesSender(senderEmail, supervisors)) {
      category = 'supervisor';
    } else if (containsAny(combined, COMPLAINT_KEYWORDS) && !containsAny(combined, NEWSLETTER_KEYWORDS)) {
      category = 'complaints';
    } else if (matchesSender(senderEmail, customers)) {
      category = 'customer';
    } else if (matchesSender(senderEmail, suppliers)) {
      category = 'supplier';
    } else if (matchesSender(senderEmail, proxies)) {
      category = 'proxy';
    } else if (email.importance === 'high') {
      category = 'highPriority';
    } else if (customCats.some(c => containsAny(combined, c.keywords))) {
      category = customCats.find(c => containsAny(combined, c.keywords))!.key;
    } else if (containsAny(combined, SPAM_KEYWORDS)) {
      category = 'spam';
    } else if (containsAny(combined, NEWSLETTER_KEYWORDS) || NEWSLETTER_SENDERS.some(ns => senderEmail.includes(ns))) {
      category = 'newsletter';
    } else if (containsAny(combined, MEETING_KEYWORDS)) {
      category = 'meetings';
    } else if (config.tasksEnabled && isTaskForMe(email, config.userEmail, config.userName, combined)) {
      category = 'tasksForMe';
    } else if (isCC) {
      category = 'inCC';
    } else {
      category = 'uncategorized';
    }

    const qa = QUICK_ACTIONS[category];

    return {
      id: email.id,
      conversationId: email.conversationId,
      sender: senderName,
      senderEmail,
      initials: getInitials(senderName),
      avatarColor: getAvatarColor(senderName),
      date: formatDate(email.receivedDateTime),
      dateRaw: email.receivedDateTime,
      preview: email.bodyPreview || '',
      subject: email.subject || '(no subject)',
      category,
      unread: !email.isRead,
      flagged: email.flag?.flagStatus === 'flagged',
      body: email.bodyPreview || '',
      bodyHtml: email.body?.content || email.bodyPreview || '',
      importance: email.importance,
      hasAttachments: email.hasAttachments,
      toRecipients: (email.toRecipients || []).map(r => r.emailAddress.address),
      ccRecipients: (email.ccRecipients || []).map(r => r.emailAddress.address),
      aiSummary: heuristicSummary(email, senderName, category),
      quickAction: qa?.label,
      quickActionColor: qa?.color,
    };
  });
}
