import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../utils/api";
import "../cssfiles/communityBot.css";

function CommunityBot() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi, I’m here with you. You can say whatever you need 💗",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/bot/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId, message: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I’m still here 🤍 Something went wrong, but you can keep talking.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="community-bot-page">
      {/* HEADER */}
      <div className="chat-header">
        <button
          className="back-btn"
          onClick={() => navigate("/community")}
          aria-label="Back to communities"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h3>{communityId.replace("-", " ").toUpperCase()}</h3>
      </div>

      {/* CHAT */}
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}

        {loading && <div className="chat-message bot typing">typing…</div>}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <input
          value={input}
          placeholder="we are listening…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default CommunityBot;
