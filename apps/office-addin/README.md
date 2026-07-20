# Absentbox — Outlook Add-in

Smart email prioritization for professionals returning from absence. Absentbox fetches every
email received during a configured absence window, categorizes it with a deterministic
rule engine (optionally enriched by AI), summarizes the whole period, and lets the user
act on emails (reply, forward, flag, archive, delete, re-categorize) — with every action
reflected back into the real Outlook mailbox via Microsoft Graph.

**Production URL:** https://office-addin-theta.vercel.app
**Add-in manifest:** [`manifest.xml`](./manifest.xml) (points at the production URL)

---

## Feature map (per milestone plan)

| Milestone | Feature | Where |
|---|---|---|
| M1 | MSAL (Microsoft 365 OAuth) auth, task pane shell, Fluent-inspired Figma UI | `src/auth.ts`, `src/components/auth/` |
| M2 | Absence window selection (planned + retroactive), Out-of-Office auto-detection, paginated fetch of up to 500 emails with dedup | `src/api/graph.ts` (`fetchAbsenceEmails`, `fetchAutoReplyWindow`), `src/components/onboarding/` |
| M3 | Rule-based categorization (High Priority, Customer, Supervisor, Supplier, Meetings, Newsletter, Spam, Complaints, Proxy, in CC, Tasks for Me), custom keyword categories, VIP contacts, user-defined pill order | `src/api/categorize.ts`, `src/store/AppContext.tsx` |
| M4 | Review dashboard: grouped views, search, sort, quick actions (mark done/archive, flag, delete, keep unread, move between categories with Outlook category labels) | `src/components/dashboard/Dashboard.tsx` |
| M5 | AI 3-sentence summaries, deep analysis, absence-period executive digest, translation, meeting recognition + weekly calendar view, thread clustering | `api/ai.ts` (serverless), `src/api/ai.ts` (client) |
| M6 | Error boundary, sanitized email HTML (DOMPurify), type-checked build, i18n (EN/DE complete), dynamic trial/billing dates, deployment | throughout |

## Architecture

```
Outlook task pane (React 18 + Vite + Tailwind)
 ├─ MSAL.js  ──────────────►  Microsoft 365 OAuth (popup)
 ├─ src/api/graph.ts ─────►  Microsoft Graph API  (mail, calendar, profile, mailboxSettings)
 └─ src/api/ai.ts ────────►  /api/ai  (Vercel serverless function)
                              └─► OpenAI (OPENAI_API_KEY) or Anthropic (ANTHROPIC_API_KEY)
```

- **No email content is stored server-side.** The serverless function is stateless; emails
  pass through only for summarization. User settings persist in `localStorage`.
- **AI degrades gracefully.** Without an API key the app uses deterministic local
  summaries/digests (labeled "Rule-based summary" in the UI). With a key configured they
  are AI-generated (labeled "AI summary").

## Setup

### 1. Azure App Registration (required for real mailbox data)

Azure Portal → Microsoft Entra ID → App registrations → the Absentbox app
(client id `7cf7cc59-4d88-4f3b-9905-f4a5f4afc5ed`):

1. **Authentication → Single-page application** — the redirect URIs must include:
   - `https://office-addin-theta.vercel.app`  ⚠️ *add this — the production domain changed*
   - `https://localhost:5173` (local dev)
2. **API permissions (Delegated):** `User.Read`, `Mail.ReadWrite`, `Calendars.ReadWrite`,
   `MailboxSettings.Read` (the last one powers Out-of-Office auto-detection).

### 2. Enable AI (optional but recommended)

Vercel dashboard → project **office-addin** → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | an OpenAI key (uses `gpt-4o-mini`) |
| `ANTHROPIC_API_KEY` | *or* an Anthropic key (uses Claude Haiku) |

Redeploy after adding. Verify with `GET /api/ai` → `{"configured": true}`.

### 3. Sideload in Outlook

- **Outlook Web:** Settings → Manage add-ins → My add-ins → Add a custom add-in →
  Add from file → select `manifest.xml`.
- **Outlook Desktop (Windows/Mac):** same flow via *Get Add-ins → My add-ins → Custom add-ins*.
- For org-wide rollout: Microsoft 365 admin center → Integrated apps → Upload custom app,
  or submit to AppSource.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc --noEmit
npm run build        # type-check + production build to dist/
vercel deploy --prod # deploy (project: office-addin)
```

Without signing in, the dashboard runs in **Demo Mode** (badge in the side menu) with
sample data so the full UI is reviewable in any browser.

## Notes & known limitations

- **Email/password login + registration screens** are part of the approved Figma design
  and function as a demo flow only; real authentication is exclusively
  **Sign in with Microsoft** (MSAL). A backend account system was not in the milestone scope.
- **Billing/checkout** is the designed UI flow with simulated state (no payment processor
  connected — out of milestone scope).
- **Languages:** English and German are complete; French/Spanish fall back to English.
- Email HTML bodies are sanitized with DOMPurify before rendering.
