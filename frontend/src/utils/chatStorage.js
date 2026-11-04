// Saved conversations live only in this browser (localStorage).
// Every access is wrapped: storage can be blocked or full, and the chat must
// keep working without it.

const STORAGE_KEY = 'chat-history-v1';
const MAX_CONVERSATIONS = 30;
const MAX_MESSAGES = 60;
const TITLE_LENGTH = 60;

export function loadConversations() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function write(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Quota exceeded or storage blocked: history just isn't saved.
  }
}

export function makeTitle(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > TITLE_LENGTH ? `${clean.slice(0, TITLE_LENGTH)}…` : clean;
}

// Inserts or replaces a conversation, stamping it as updated now, and
// returns the new, newest-first list.
export function saveConversation(conversation) {
  const trimmed = {
    ...conversation,
    updatedAt: Date.now(),
    // Error bubbles are UI-only; don't keep them.
    messages: conversation.messages.filter((m) => !m.errorKey).slice(-MAX_MESSAGES),
  };
  const others = loadConversations().filter((c) => c.id !== conversation.id);
  const next = [trimmed, ...others]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
  write(next);
  return next;
}

export function deleteConversation(id) {
  const next = loadConversations().filter((c) => c.id !== id);
  write(next);
  return next;
}

export function clearConversations() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return [];
}

// What the backend needs to rebuild context: plain text turns only.
export function toApiHistory(messages) {
  return messages
    .filter((m) => !m.errorKey && m.text)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 4000) }))
    .slice(-20);
}

export function newConversationId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Which conversation is open, for this tab only (sessionStorage), so leaving
// the chat for a doctor's page and coming back reopens it.
const ACTIVE_KEY = 'chat-active-id';

export function loadActiveId() {
  try {
    return sessionStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id) {
  try {
    if (id) sessionStorage.setItem(ACTIVE_KEY, id);
    else sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}
