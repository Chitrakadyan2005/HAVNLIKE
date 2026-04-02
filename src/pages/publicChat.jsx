import React, { useState, useEffect, useRef } from "react";
import "../cssfiles/layout.css";
import "../cssfiles/publicChat.css";
import { Link, useParams, useLocation } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { useTranslation } from "react-i18next";
import API_URL from "../utils/api";

function PublicChat({ socket }) {
  const { t } = useTranslation();
  const { roomName } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const username = sessionStorage.getItem("username") || "anon";
  const joinedOnceRef = useRef(false);
  const bottomRef = useRef(null);

  /**
   * NOTE:
   * These terms are used strictly for abuse detection
   * and moderation in public chat spaces.
   * They do not reflect developer language or intent.
   */

  const hardAbusePatterns = [
    "go kill yourself",
    "i will kill you",
    "you should die",
    "rape",
    "terrorist",
    "kill u",
    "die bitch",
  ];

  const softAbuseWords = [
    // English
    "ugly",
    "loser",
    "asshole",
    "bitch",
    "shit",
    "slut",
    "whore",

    // Hinglish / Hindi slang
    "kutti",
    "kamina",
    "harami",
    "chutiya",
    "madarchod",
    "bhenchod",
    "randi",
  ];

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "") // remove symbols & numbers
      .replace(/\s+/g, " ") // normalize spaces
      .trim();
  };

  const containsBlockedText = (text) => {
    if (!text) return false;

    const clean = normalizeText(text);

    if (hardAbusePatterns.some((p) => clean.includes(p))) return true;

    return softAbuseWords.some((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(clean);
    });
  };

  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUnread = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/notification/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        setHasUnread(data.hasUnread);
      } catch (err) {
        console.error("Unread check failed", err);
      }
    };

    checkUnread();
  }, []);

  const location = useLocation();

  const backTo = location.state?.from || "/room";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    if (!joinedOnceRef.current) {
      socket.emit("joinRoom", { username, requestedRoom: roomName });
      joinedOnceRef.current = true;
    }

    const handleMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          from: msg.from === username ? "me" : msg.from,
        },
      ]);
    };

    const handleUserJoined = ({ username: who, id }) => {
      const isMe = id === socket.id || who === username;
      const text = isMe ? `You joined #${roomName}` : `@${who} joined the room`;
      setMessages((prev) => [...prev, { from: "system", text }]);
    };

    socket.on("message", handleMessage);
    socket.on("userJoined", handleUserJoined);

    return () => {
      socket.off("message", handleMessage);
      socket.off("userJoined", handleUserJoined);
    };
  }, [socket, roomName, username]);

  const sendMessage = () => {
    if (!message.trim()) return;

    if (containsBlockedText(message)) return;

    socket.emit("chatMessage", {
      from: username,
      text: message,
    });

    setMessage("");
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="HomePage">
      <img
        src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
        alt="wallpaper"
        className="bg-image"
      />

      <nav className="Navbar">{t("home.navbar")}</nav>
      <div className="main-content">
        <aside className="left-panel">
          <ul className="leftpanel-animated">

            <Link to="/room" style={{ textDecoration: "none" }}>
              <li style={{ "--i": "#80FF72", "--j": "#7EE8FA" }}>
                <div className="icon">
                  <i className="bi bi-tv"></i>
                </div>
                <span className="title">{t("home.tabs.room")}</span>
              </li>
            </Link>
            <Link to="/search" style={{ textDecoration: "none" }}>
              <li style={{ "--i": "#56CCF2", "--j": "#2F80ED" }}>
                <div className="icon">
                  <i className="bi bi-search"></i>
                </div>
                <span className="title">{t("home.tabs.search")}</span>
              </li>
            </Link>

            <Link to="/community" style={{ textDecoration: "none" }}>
              <li style={{ "--i": "#ff9ad5", "--j": "#ffd1ea" }}>
                <div className="icon">
                  <i className="bi bi-people"></i>
                </div>
                <span className="title">Community</span>
              </li>
            </Link>

            <Link to="/dm" style={{ textDecoration: "none" }}>
              <li style={{ "--i": "#ffa9c6", "--j": "#f434e2" }}>
                <div className="icon">
                  <i className="bi bi-chat-dots"></i>
                </div>
                <span className="title">{t("home.tabs.dm")}</span>
              </li>
            </Link>

            <Link to="/notification" style={{ textDecoration: "none" }}>
              <li style={{ "--i": "#f6d365", "--j": "#fda085" }}>
                <div className="notification-icon-wrapper">
                  <i className="bi bi-bell"></i>
                  {hasUnread && <span className="notif-dot"></span>}
                </div>
                <span className="title">{t("home.tabs.notification")}</span>
              </li>
            </Link>

            <Link to="/settings" style={{ textDecoration: "none" }}>
              <li style={{ "--i": "#84fab0", "--j": "#8fd3f4" }}>
                <div className="icon">
                  <i className="bi bi-gear"></i>
                </div>
                <span className="title">{t("home.tabs.settings")}</span>
              </li>
            </Link>

            <Link
              to={`/profile/${username}`}
              style={{ textDecoration: "none" }}
            >
              <li style={{ "--i": "#c471f5", "--j": "#fa71cd" }}>
                <div className="icon">
                  <i className="bi bi-person"></i>
                </div>
                <span className="title">{t("home.tabs.profile")}</span>
              </li>
            </Link>
          </ul>
        </aside>

        <section className="feed">
          <div className="chat-page">
            <nav className="chat-navbar">
              <Link to={backTo} className="back-btn">
                ⬅
              </Link>
              <h3>#{roomName}</h3>
            </nav>

            <div className="chat-body">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble ${msg.from === "me" || msg.from === username ? "sent" : "received"}`}
                >
                  {msg.from !== "me" && msg.from !== username && (
                    <span className="sender">@{msg.from}</span>
                  )}
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="chat-input-container">
              <button
                className="emoji-btn"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="emoji-popup">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
              <input
                type="text"
                placeholder={t("publicChat.placeholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button className="send-button" onClick={sendMessage}>
                {t("publicChat.send")}
              </button>
            </div>
          </div>
        </section>

        <aside className="right-panel">
          <p className="welcome-text">{t("home.greeting")}</p>

          <div className="reach-out">
            <span>{t("home.reachOut")}</span>
            <a
              href="https://www.instagram.com/havnlike.space?igsh=ODJ1MnQ0MmVweWdx"
              target="_blank"
              rel="noopener noreferrer"
              className="insta-btn"
            >
              <i className="bi bi-instagram"></i>
            </a>
          </div>
        </aside>
      </div>

      <nav className="mobile-bottom-nav">
        <Link to="/room" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#80FF72", "--j": "#7EE8FA" }}>
            <div className="icon">
              <i className="bi bi-tv"></i>
            </div>
          </li>
        </Link>
        <Link to="/search" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#56CCF2", "--j": "#2F80ED" }}>
            <div className="icon">
              <i className="bi bi-search"></i>
            </div>
          </li>
        </Link>
        <Link to="/community" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#ff9ad5", "--j": "#ffd1ea" }}>
            <div className="icon">
              <i className="bi bi-people"></i>
            </div>
          </li>
        </Link>
        <Link to="/dm" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#ffa9c6", "--j": "#f434e2" }}>
            <div className="icon">
              <i className="bi bi-chat-dots"></i>
            </div>
          </li>
        </Link>
        <Link to="/notification" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#f6d365", "--j": "#fda085" }}>
            <div className="notification-icon-wrapper">
              <i className="bi bi-bell"></i>
              {hasUnread && <span className="notif-dot"></span>}
            </div>
          </li>
        </Link>
        <Link to="/settings" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#84fab0", "--j": "#8fd3f4" }}>
            <div className="icon">
              <i className="bi bi-gear"></i>
            </div>
          </li>
        </Link>
        <Link to={`/profile/${username}`} style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#c471f5", "--j": "#fa71cd" }}>
            <div className="icon">
              <i className="bi bi-person"></i>
            </div>
          </li>
        </Link>
      </nav>
    </div>
  );
}

export default PublicChat;
