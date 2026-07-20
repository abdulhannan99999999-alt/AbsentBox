import { PublicClientApplication, AccountInfo, SilentRequest } from '@azure/msal-browser';
import { msalInstance, loginRequest } from '../auth';

// ── Types ──
export interface GraphEmail {
  id: string;
  conversationId?: string;
  subject: string;
  bodyPreview: string;
  body?: { contentType: string; content: string };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients?: { emailAddress: { name: string; address: string } }[];
  ccRecipients?: { emailAddress: { name: string; address: string } }[];
  receivedDateTime: string;
  isRead: boolean;
  categories: string[];
  importance: string;
  hasAttachments: boolean;
  flag?: { flagStatus: string };
}

export interface GraphCalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  isAllDay: boolean;
  location?: { displayName: string };
  attendees?: { emailAddress: { name: string; address: string }; status: { response: string } }[];
}

export interface GraphUserProfile {
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  jobTitle: string;
  companyName: string;
  mobilePhone: string;
  businessPhones: string[];
  officeLocation?: string;
  department?: string;
}

// ── Categorized Email (our internal format) ──
export interface CategorizedEmail {
  id: string;
  conversationId?: string;
  flagged: boolean;
  sender: string;
  senderEmail: string;
  initials: string;
  avatarColor: string;
  date: string;
  dateRaw: string;
  preview: string;
  subject: string;
  category: string;
  unread: boolean;
  body: string;
  bodyHtml: string;
  importance: string;
  hasAttachments: boolean;
  toRecipients: string[];
  ccRecipients: string[];
  aiSummary: string;
  quickAction?: string;
  quickActionColor?: string;
}

// ── Graph API Fetch Helper ──
async function callGraph<T>(endpoint: string, method: string = 'GET', body?: object): Promise<T> {
  const account = msalInstance.getAllAccounts()[0];
  if (!account) throw new Error('No authenticated account found');

  const silentRequest: SilentRequest = {
    scopes: loginRequest.scopes,
    account,
  };

  let tokenResponse;
  try {
    tokenResponse = await msalInstance.acquireTokenSilent(silentRequest);
  } catch (e) {
    tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
  }

  const config: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${tokenResponse.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET' && method !== 'DELETE') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, config);

  // DELETE returns 204 No Content
  if (response.status === 204) return {} as T;

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API error ${response.status}: ${error}`);
  }

  // Some endpoints return empty body
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

// ── READ Operations ──

/** Fetch current user's profile */
export async function fetchUserProfile(): Promise<GraphUserProfile> {
  return callGraph<GraphUserProfile>('/me?$select=displayName,givenName,surname,mail,jobTitle,companyName,mobilePhone,businessPhones,officeLocation,department');
}

/** Fetch user's profile photo as blob URL */
export async function fetchUserPhoto(): Promise<string | null> {
  try {
    const account = msalInstance.getAllAccounts()[0];
    if (!account) return null;

    const silentRequest: SilentRequest = { scopes: loginRequest.scopes, account };
    let tokenResponse;
    try {
      tokenResponse = await msalInstance.acquireTokenSilent(silentRequest);
    } catch {
      tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
    });

    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

const EMAIL_SELECT = '$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,isRead,categories,importance,hasAttachments,flag';

/** Fetch user's emails */
export async function fetchEmails(top: number = 100, skip: number = 0, filter?: string): Promise<GraphEmail[]> {
  let endpoint = `/me/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&${EMAIL_SELECT}`;
  if (filter) {
    endpoint += `&$filter=${encodeURIComponent(filter)}`;
  }
  const result = await callGraph<{ value: GraphEmail[] }>(endpoint);
  return result.value || [];
}

/**
 * Fetch ALL emails received inside an absence window (M2 core).
 * Follows @odata.nextLink pagination so large inboxes (200–500+ mails)
 * are retrieved completely, deduplicated by message id.
 */
export async function fetchAbsenceEmails(
  startDate: string,
  endDate: string,
  maxEmails: number = 500,
): Promise<GraphEmail[]> {
  // Window is inclusive: [start 00:00, end 23:59:59]
  const start = `${startDate}T00:00:00Z`;
  const end = `${endDate}T23:59:59Z`;
  const filter = encodeURIComponent(`receivedDateTime ge ${start} and receivedDateTime le ${end}`);
  let endpoint: string | null =
    `/me/messages?$top=100&$orderby=receivedDateTime desc&$filter=${filter}&${EMAIL_SELECT}`;

  const seen = new Set<string>();
  const all: GraphEmail[] = [];

  while (endpoint && all.length < maxEmails) {
    const result: { value: GraphEmail[]; '@odata.nextLink'?: string } = await callGraph(endpoint);
    for (const email of result.value || []) {
      if (!seen.has(email.id)) {
        seen.add(email.id);
        all.push(email);
      }
    }
    const next = result['@odata.nextLink'];
    endpoint = next ? next.replace('https://graph.microsoft.com/v1.0', '') : null;
  }
  return all.slice(0, maxEmails);
}

export interface AutoReplyWindow {
  enabled: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Detect the user's Out-of-Office (automatic replies) window so the
 * absence period can be suggested automatically (M2).
 */
export async function fetchAutoReplyWindow(): Promise<AutoReplyWindow | null> {
  try {
    const result = await callGraph<{
      automaticRepliesSetting?: {
        status: string;
        scheduledStartDateTime?: { dateTime: string };
        scheduledEndDateTime?: { dateTime: string };
      };
    }>('/me/mailboxSettings/automaticRepliesSetting');
    const s = (result as any).status ? (result as any) : result.automaticRepliesSetting;
    if (!s || s.status === 'disabled') return null;
    const startRaw = s.scheduledStartDateTime?.dateTime;
    const endRaw = s.scheduledEndDateTime?.dateTime;
    if (!startRaw || !endRaw) return null;
    return {
      enabled: true,
      startDate: startRaw.split('T')[0],
      endDate: endRaw.split('T')[0],
    };
  } catch {
    return null;
  }
}

/** Fetch user's calendar events for a date range */
export async function fetchCalendarEvents(startDate: string, endDate: string): Promise<GraphCalendarEvent[]> {
  const endpoint = `/me/calendarView?startDateTime=${startDate}&endDateTime=${endDate}&$select=id,subject,start,end,organizer,isAllDay,location,attendees&$orderby=start/dateTime&$top=50`;
  const result = await callGraph<{ value: GraphCalendarEvent[] }>(endpoint);
  return result.value || [];
}

// ── WRITE Operations (Real Email Actions) ──

/** Delete an email permanently */
export async function deleteEmail(emailId: string): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}`, 'DELETE');
}

/** Mark email as read or unread */
export async function markEmailReadStatus(emailId: string, isRead: boolean): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}`, 'PATCH', { isRead });
}

/** Move email to a folder (e.g., 'deleteditems', 'junkemail', 'inbox') */
export async function moveEmail(emailId: string, destinationFolder: string): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}/move`, 'POST', { destinationId: destinationFolder });
}

/** Forward an email */
export async function forwardEmail(emailId: string, toEmail: string, comment?: string): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}/forward`, 'POST', {
    comment: comment || '',
    toRecipients: [{ emailAddress: { address: toEmail } }],
  });
}

/** Reply to an email */
export async function replyToEmail(emailId: string, replyBody: string): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}/reply`, 'POST', {
    comment: replyBody,
  });
}

/** Flag/unflag an email */
export async function flagEmail(emailId: string, flagged: boolean): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}`, 'PATCH', {
    flag: { flagStatus: flagged ? 'flagged' : 'notFlagged' },
  });
}

/** Archive an email ("mark as done") — moves it to the Archive folder */
export async function archiveEmail(emailId: string): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}/move`, 'POST', { destinationId: 'archive' });
}

/**
 * Sync an Absentbox category onto the real Outlook message as a category
 * label, so "move between categories" is reflected inside Outlook (M4).
 */
export async function setOutlookCategory(emailId: string, categoryLabel: string): Promise<void> {
  await callGraph<void>(`/me/messages/${emailId}`, 'PATCH', {
    categories: [`Absentbox: ${categoryLabel}`],
  });
}

// ── Auth Helpers ──

/** Check if user is authenticated with valid accounts */
export function isGraphAuthenticated(): boolean {
  return msalInstance.getAllAccounts().length > 0;
}

/** Get the active account */
export function getActiveAccount(): AccountInfo | null {
  return msalInstance.getAllAccounts()[0] || null;
}
