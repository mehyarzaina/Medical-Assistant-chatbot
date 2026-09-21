import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api";
import DoctorCard from "../components/DoctorCard";
import DoctorDetail from "../components/DoctorDetail";
import "./Chat.css";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, text);
      setSessionId(res.session_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.reply, doctors: res.doctors ?? [] },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "حدث خطأ، حاول مرة أخرى.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-page">
      <h1>المساعد الطبي</h1>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-message ${
              m.role === "user" ? "chat-message-user" : "chat-message-assistant"
            }`}
          >
            <p>{m.text}</p>
            {m.doctors?.length > 0 && (
              <div className="chat-doctor-results">
                {m.doctors.map((d) => (
                  <DoctorCard
                    key={d.doctor_id}
                    doctor={d}
                    onSelect={setSelectedDoctorId}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-message chat-message-assistant chat-typing">
            جاري الكتابة...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك هنا..."
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          إرسال
        </button>
      </div>

      {selectedDoctorId && (
        <DoctorDetail
          doctorId={selectedDoctorId}
          onClose={() => setSelectedDoctorId(null)}
        />
      )}
    </div>
  );
}