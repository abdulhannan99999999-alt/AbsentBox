/* ── Absentbox AI Backend (M5) ──
 * Vercel serverless function. Provides email summarization, absence digests
 * and translation via OpenAI (OPENAI_API_KEY) or Anthropic (ANTHROPIC_API_KEY).
 * Configure either key in the Vercel project settings. Without a key the
 * endpoint reports "not configured" and the add-in falls back to its
 * deterministic local summaries — the app keeps working either way.
 */

const OPENAI_MODEL = 'gpt-4o-mini';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const MAX_BODY_CHARS = 6000;
const MAX_DIGEST_EMAILS = 100;

interface AiRequest {
  action: 'summary' | 'detail' | 'digest' | 'translate';
  language?: string;
  email?: { sender: string; subject: string; body: string };
  emails?: { sender: string; subject: string; preview: string; category: string }[];
  period?: { start: string; end: string };
  text?: string;
  targetLang?: string;
}

const LANG_NAMES: Record<string, string> = { en: 'English', de: 'German', fr: 'French', es: 'Spanish' };

function buildPrompt(body: AiRequest): { system: string; user: string } {
  const lang = LANG_NAMES[body.language || 'en'] || 'English';
  switch (body.action) {
    case 'summary': {
      const e = body.email!;
      return {
        system: `You summarize business emails for a professional returning from absence. Respond in ${lang}. Write EXACTLY 3 short sentences: (1) who the sender is and why they wrote, (2) the core request or update, (3) the required next step. No preamble.`,
        user: `From: ${e.sender}\nSubject: ${e.subject}\n\n${e.body.substring(0, MAX_BODY_CHARS)}`,
      };
    }
    case 'detail': {
      const e = body.email!;
      return {
        system: `You produce a structured deep analysis of a business email for a professional returning from absence. Respond in ${lang}. Use short bullet points covering: context, key points, decisions/deadlines mentioned, and recommended actions. Maximum 120 words.`,
        user: `From: ${e.sender}\nSubject: ${e.subject}\n\n${e.body.substring(0, MAX_BODY_CHARS)}`,
      };
    }
    case 'digest': {
      const list = (body.emails || []).slice(0, MAX_DIGEST_EMAILS)
        .map(e => `- [${e.category}] ${e.sender}: ${e.subject} — ${e.preview.substring(0, 100)}`)
        .join('\n');
      return {
        system: `You write an executive summary for a professional returning from absence. Respond in ${lang}. Write EXACTLY 3 sentences: (1) overall volume and what dominated the period, (2) the most urgent items needing attention today, (3) what can safely be deprioritized. No preamble.`,
        user: `Absence period: ${body.period?.start} to ${body.period?.end}\nEmails received:\n${list}`,
      };
    }
    case 'translate':
      return {
        system: `Translate the following text to ${LANG_NAMES[body.targetLang || 'en'] || 'English'}. Output only the translation.`,
        user: (body.text || '').substring(0, MAX_BODY_CHARS),
      };
    default:
      throw new Error('Unknown action');
  }
}

async function callOpenAI(system: string, user: string, key: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 400,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function callAnthropic(system: string, user: string, key: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || '';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const configured = Boolean(openaiKey || anthropicKey);

  // Health / capability probe
  if (req.method === 'GET') {
    return res.status(200).json({ configured, provider: openaiKey ? 'openai' : anthropicKey ? 'anthropic' : null });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!configured) return res.status(501).json({ error: 'AI provider not configured', configured: false });

  try {
    const body: AiRequest = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body?.action) return res.status(400).json({ error: 'Missing action' });
    const { system, user } = buildPrompt(body);
    const result = openaiKey
      ? await callOpenAI(system, user, openaiKey)
      : await callAnthropic(system, user, anthropicKey!);
    return res.status(200).json({ result, configured: true });
  } catch (err: any) {
    console.error('AI handler error:', err);
    return res.status(502).json({ error: err.message || 'AI request failed' });
  }
}
