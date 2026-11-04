import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { sendChatMessage } from "../api";
import DoctorCard from "../components/DoctorCard";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import {
  loadConversations,
  saveConversation,
  deleteConversation,
  clearConversations,
  makeTitle,
  newConversationId,
  toApiHistory,
  loadActiveId,
  saveActiveId,
} from "../utils/chatStorage";
import "./Chat.css";

function relativeTime(timestamp, now, lang) {
  const minutes = Math.round((timestamp - now) / 60000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

export default function Chat() {
  const { t, lang } = useLanguage();
  usePageTitle("chat");
  const [conversations, setConversations] = useState(loadConversations);
  // The open conversation survives visiting a doctor's page and coming back.
  const [restored] = useState(() => conversations.find((c) => c.id === loadActiveId()) ?? null);
  const [activeId, setActiveIdState] = useState(restored?.id ?? null);
  const [messages, setMessages] = useState(restored?.messages ?? []);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(restored?.sessionId ?? null);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // "5 minutes ago" labels in the history list; refreshed once a minute.
  const [now, setNow] = useState(Date.now);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  function setActiveId(id) {
    setActiveIdState(id);
    saveActiveId(id);
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(text) {
    text = text.trim();
    if (!text || loading) return;

    const id = activeId ?? newConversationId();
    const title = conversations.find((c) => c.id === id)?.title ?? makeTitle(text);
    const before = messages;
    const withUser = [...before, { role: "user", text }];

    setActiveId(id);
    setMessages(withUser);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, text, lang, toApiHistory(before));
      const withReply = [...withUser, { role: "assistant", text: res.reply, doctors: res.doctors ?? [] }];
      setSessionId(res.session_id);
      setMessages(withReply);
      setConversations(saveConversation({ id, title, sessionId: res.session_id, messages: withReply }));
    } catch {
      // Stored as a key so it follows the language toggle; never saved to history.
      setMessages([...withUser, { role: "assistant", errorKey: "chat.error" }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  function startNewConversation() {
    setActiveId(null);
    setMessages([]);
    setSessionId(null);
    setInput("");
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  function openConversation(conv) {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setSessionId(conv.sessionId ?? null);
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  function removeConversation(conv) {
    setConversations(deleteConversation(conv.id));
    if (conv.id === activeId) startNewConversation();
  }

  function removeAll() {
    if (!window.confirm(t("chat.clearConfirm"))) return;
    setConversations(clearConversations());
    startNewConversation();
  }

  const suggestions = t("chat.suggestions");

  return (
    <div className="chat-layout">
      {historyOpen && (
        <div className="chat-history-backdrop" onClick={() => setHistoryOpen(false)} aria-hidden="true" />
      )}

      <aside
        id="chat-history"
        className={`chat-history ${historyOpen ? "is-open" : ""}`}
        aria-label={t("chat.history")}
      >
        <button type="button" className="chat-history-new" onClick={startNewConversation}>
          <span aria-hidden="true">+</span> {t("chat.newChat")}
        </button>

        <h2 className="chat-history-title">{t("chat.history")}</h2>
        {conversations.length === 0 ? (
          <p className="chat-history-empty">{t("chat.noHistory")}</p>
        ) : (
          <ul className="chat-history-list">
            {conversations.map((conv) => (
              <li key={conv.id} className={conv.id === activeId ? "is-active" : ""}>
                <button
                  type="button"
                  className="chat-history-item"
                  onClick={() => openConversation(conv)}
                  aria-current={conv.id === activeId ? "true" : undefined}
                >
                  <span className="chat-history-item-title" dir="auto">{conv.title}</span>
                  <span className="chat-history-item-time">{relativeTime(conv.updatedAt, now, lang)}</span>
                </button>
                <button
                  type="button"
                  className="chat-history-delete"
                  onClick={() => removeConversation(conv)}
                  aria-label={t("chat.deleteChat", { title: conv.title })}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="chat-history-footer">
          <p>{t("chat.historyNote")}</p>
          {conversations.length > 0 && (
            <button type="button" className="chat-history-clear" onClick={removeAll}>
              {t("chat.clearAll")}
            </button>
          )}
        </div>
      </aside>

      <section className="chat-page" aria-labelledby="chat-title">
        <header className="chat-header">
          <button
            type="button"
            className="chat-history-toggle"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
            aria-controls="chat-history"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            {t("chat.history")}
          </button>
          <div>
            <h1 id="chat-title">{t("chat.title")}</h1>
            <p className="chat-intro">{t("chat.intro")}</p>
          </div>
        </header>

        <div className="chat-messages" role="log" aria-label={t("chat.log")} aria-live="polite">
          {messages.length === 0 && !loading && (
            <div className="chat-empty">
              <p className="chat-empty-title">{t("chat.suggestionsTitle")}</p>
              <ul className="chat-suggestions">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => send(s)}>{s}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-message ${
                m.role === "user" ? "chat-message-user" : "chat-message-assistant"
              } ${m.errorKey ? "chat-message-error" : ""}`}
            >
              <span className="visually-hidden">
                {m.role === "user" ? t("chat.you") : t("chat.assistant")}:
              </span>
              <p dir="auto">{m.errorKey ? t(m.errorKey) : m.text}</p>
              {m.doctors?.length > 0 && (
                <div className="chat-doctor-results">
                  {m.doctors.map((d) => (
                    <DoctorCard key={d.doctor_id} doctor={d} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message chat-message-assistant chat-typing" role="status">
              <span className="chat-typing-dots" aria-hidden="true">
                <span /><span /><span />
              </span>
              <span className="visually-hidden">{t("chat.typing")}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit}>
          <div className="chat-input-bar">
            <label htmlFor="chat-input" className="visually-hidden">{t("chat.inputLabel")}</label>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              dir="auto"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              aria-describedby="chat-privacy-note"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {t("chat.send")}
            </button>
          </div>
          <p className="chat-privacy-note" id="chat-privacy-note">
            {t("chat.privacyNote")} <Link to="/privacy">{t("chat.privacyLink")}</Link>
          </p>
        </form>
      </section>

    </div>
  );
}
