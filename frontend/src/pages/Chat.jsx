import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { sendChatMessage } from "../api";
import DoctorCard from "../components/DoctorCard";
import DoctorDetail from "../components/DoctorDetail";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import "./Chat.css";

export default function Chat() {
  const { t, lang } = useLanguage();
  usePageTitle("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, text, lang);
      setSessionId(res.session_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.reply, doctors: res.doctors ?? [] },
      ]);
    } catch {
      // Stored as a key so it follows the language toggle.
      setMessages((prev) => [...prev, { role: "assistant", errorKey: "chat.error" }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function startNewConversation() {
    setMessages([]);
    setSessionId(null);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div>
          <h1>{t("chat.title")}</h1>
          <p className="chat-intro">{t("chat.intro")}</p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="chat-new-btn" onClick={startNewConversation}>
            {t("chat.newChat")}
          </button>
        )}
      </header>

      <div className="chat-messages" role="log" aria-label={t("chat.log")} aria-live="polite">
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
                  <DoctorCard key={d.doctor_id} doctor={d} onSelect={setSelectedDoctorId} />
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

      <form className="chat-input-area" onSubmit={handleSend}>
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

      {selectedDoctorId && (
        <DoctorDetail doctorId={selectedDoctorId} onClose={() => setSelectedDoctorId(null)} />
      )}
    </div>
  );
}
