import { CategorizedEmail } from './graph';

/* ── AI Client (M5) ──
 * Talks to the /api/ai serverless endpoint. Every function degrades
 * gracefully to a deterministic local fallback when the backend is
 * unreachable or no AI key is configured, so the add-in always works.
 */

const AI_TIMEOUT_MS = 20000;

let aiConfiguredCache: boolean | null = null;

async function aiFetch(path: string, options?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(path, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`AI endpoint ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Probe whether a real AI provider is configured on the backend */
export async function checkAiConfigured(): Promise<boolean> {
  if (aiConfiguredCache !== null) return aiConfiguredCache;
  try {
    const data = await aiFetch('/api/ai');
    aiConfiguredCache = Boolean(data.configured);
  } catch {
    aiConfiguredCache = false;
  }
  return aiConfiguredCache;
}

async function aiAction(payload: object): Promise<string | null> {
  try {
    const data = await aiFetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return data.result || null;
  } catch {
    return null;
  }
}

// ── Local fallbacks (deterministic, offline-capable) ──

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function firstSentences(text: string, count: number): string {
  const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(s => s.length > 10);
  return sentences.slice(0, count).join(' ');
}

export function fallbackSummary(email: CategorizedEmail, language: string = 'en'): string {
  const bodyText = stripHtml(email.bodyHtml || email.body);
  const gist = firstSentences(bodyText, 2) || email.preview;
  const lead = language === 'de'
    ? `${email.sender} schrieb zum Thema "${email.subject}".`
    : `${email.sender} wrote regarding "${email.subject}".`;
  return `${lead} ${gist}`.substring(0, 400);
}

export function fallbackDigest(emails: CategorizedEmail[], period: { start: string; end: string }, language: string = 'en'): string {
  const de = language === 'de';
  const unread = emails.filter(e => e.unread).length;
  const byCat: Record<string, number> = {};
  emails.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + 1; });
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([c, n]) => `${n}× ${c}`).join(', ');
  const urgent = emails.filter(e => e.category === 'highPriority' || e.category === 'supervisor' || e.category === 'complaints');
  const urgentList = urgent.slice(0, 3).map(e => `"${e.subject}" (${e.sender})`).join('; ');
  if (de) {
    const urgentNote = urgent.length ? `Am dringendsten: ${urgentList}.` : 'Keine dringenden E-Mails erkannt.';
    return `Du hast ${emails.length} E-Mails (${unread} ungelesen) zwischen ${period.start} und ${period.end} erhalten — überwiegend ${top}. ${urgentNote} Newsletter und Spam können bedenkenlos gesammelt gelöscht werden.`;
  }
  const urgentNote = urgent.length ? `Most urgent: ${urgentList}.` : 'No urgent items detected.';
  return `You received ${emails.length} emails (${unread} unread) between ${period.start} and ${period.end} — mostly ${top}. ${urgentNote} Newsletters and spam can be safely batch-deleted.`;
}

// ── Public API ──

/** 3-sentence executive summary for one email */
export async function summarizeEmail(email: CategorizedEmail, language: string): Promise<{ text: string; ai: boolean }> {
  const result = await aiAction({
    action: 'summary',
    language,
    email: { sender: email.sender, subject: email.subject, body: stripHtml(email.bodyHtml || email.body) },
  });
  if (result) return { text: result, ai: true };
  return { text: fallbackSummary(email, language), ai: false };
}

/** Detailed deep-analysis of one email */
export async function detailedSummary(email: CategorizedEmail, language: string): Promise<{ text: string; ai: boolean }> {
  const result = await aiAction({
    action: 'detail',
    language,
    email: { sender: email.sender, subject: email.subject, body: stripHtml(email.bodyHtml || email.body) },
  });
  if (result) return { text: result, ai: true };
  const bodyText = stripHtml(email.bodyHtml || email.body);
  return { text: firstSentences(bodyText, 6) || email.preview, ai: false };
}

/** Global executive digest of the whole absence period */
export async function absenceDigest(
  emails: CategorizedEmail[],
  period: { start: string; end: string },
  language: string,
): Promise<{ text: string; ai: boolean }> {
  const result = await aiAction({
    action: 'digest',
    language,
    period,
    emails: emails.map(e => ({ sender: e.sender, subject: e.subject, preview: e.preview, category: e.category })),
  });
  if (result) return { text: result, ai: true };
  return { text: fallbackDigest(emails, period, language), ai: false };
}

/** Translate arbitrary text; returns null when AI is unavailable */
export async function translateText(text: string, targetLang: string): Promise<string | null> {
  return aiAction({ action: 'translate', text, targetLang });
}
