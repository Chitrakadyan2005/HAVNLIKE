import React, { useState, useEffect, useRef } from "react";
import "../cssfiles/layout.css";
import "../cssfiles/chatPage.css";
import { Link, useParams } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { useTranslation } from "react-i18next";
import socket from "../socket";
import API_URL from "../utils/api";
import { checkModeration } from "../utils/moderateText";

function ChatPage() {
  const { userId, username } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userProfiles, setUserProfiles] = useState({}); // Cache for multiple user profiles
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatRef = useRef();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const checkUnread = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/notification/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setHasUnread(data.hasUnread);
      } catch (err) {
        console.error("Unread check failed", err);
      }
    };

    checkUnread();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("username");

    if (!storedUser) {
      alert("Session expired. Please login again.");
      window.location.href = "/login";
      return;
    }

    setCurrentUser(storedUser);
  }, []);

  const token = sessionStorage.getItem("token");

  const emojiRef = useRef();

  // Function to fetch user profile by username
  const fetchUserProfile = async (username) => {
    if (userProfiles[username]) return userProfiles[username]; // Return cached profile

    try {
      const response = await fetch(`${API_URL}/api/profile/${username}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const profile = await response.json();
        console.log(`Profile for ${username}:`, profile); // Debug log
        setUserProfiles((prev) => ({ ...prev, [username]: profile }));
        return profile;
      }
    } catch (err) {
      console.error(`Error fetching profile for ${username}:`, err);
    }
    return null;
  };

  useEffect(() => {
    if (!currentUser) return;

    const storedUserId = sessionStorage.getItem("userId");

    socket.emit("join-dm", Number(storedUserId));

    socket.on("receive-dm", (msg) => {
      const normalized = {
        from: msg.from,
        senderId: msg.sender_id,
        message: msg.message || msg.text,
      };

      setMessages((prev) => {
        if (
          normalized.from === currentUser &&
          prev.some(
            (m) =>
              m.message === normalized.message &&
              m.senderId === normalized.senderId,
          )
        ) {
          return prev;
        }
        return [...prev, normalized];
      });
    });

    return () => {
      socket.off("receive-dm");
    };
  }, [currentUser]);

  // Fetch chat and user profile
  useEffect(() => {
    if (!currentUser) return;
    if (!userId) return;

    const token = sessionStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    fetch(`${API_URL}/api/dm/chat/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMessages(
          data.map((msg) => ({
            from: msg.from,
            senderId: msg.sender_id,
            message: msg.message,
          })),
        );

        if (username && username !== currentUser) {
          fetchUserProfile(username);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Chat fetch error:", err.message);
        setMessages([]);
        setLoading(false);
      });
  }, [userId, username, currentUser]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "/login";
    }
  }, [token]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (sending) return;

    setSending(true);

    try {
      const moderation = await checkModeration(message, token);

      if (!moderation.allowed) {
        if (moderation.suspended) {
          alert(
            "🚫 Your account has been temporarily suspended due to repeated abusive messages.",
          );
        } else {
          alert(
            moderation.reason === "severe_abuse"
              ? "🚫 This message violates our safety rules and was not sent."
              : `⚠️ Warning ${moderation.warningCount}/2: Please keep messages respectful.`,
          );
        }
        setSending(false);
        return;
      }

      const newMessage = {
        receiverId: userId,
        message,
      };

      // Optimistically render on sender side
      setMessages((prev) => [...prev, { from: currentUser, message }]);

      // Emit so receiver sees instantly
      socket.emit("send-dm", newMessage);
      setMessage("");

      // Persist to DB
      await fetch(`${API_URL}/api/dm/chat/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (userId) => {
    const token = sessionStorage.getItem("token");

    await fetch(`${API_URL}/api/dm/delete/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    window.location.href = "/dm";
  };

  const handleBlock = async (userId) => {
    const token = sessionStorage.getItem("token");

    await fetch(`${API_URL}/api/dm/block/${userId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    window.location.href = "/dm";
  };

  const handleReport = async (userId) => {
    const token = sessionStorage.getItem("token");

    await fetch(`${API_URL}/api/dm/report/${userId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    alert("User reported");
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  if (!currentUser) return null;

  return (
    <div className="chatPage">
      <img
        src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
        alt="wallpaper"
        className="bg-image"
      />

      <nav className="Navbar">{t("chatPage.title")}</nav>
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
              to={`/profile/${currentUser}`}
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
          <div className="dm-chat-container">
            <nav className="dm-navbar">
              <div className="chat-left">
                <Link to="/dm" className="back-btn">
                  ←
                </Link>
                <div className="chat-user-info">
                  <img
                    src={userProfiles[username]?.avatarUrl || "/pfps/pfp1.jpg"}
                    alt={username}
                    className="chat-navbar-avatar"
                  />
                  <Link
                    to={`/profile/${username}`}
                    className="chat-username-link"
                  >
                    <h3>@{username}</h3>
                  </Link>
                </div>
              </div>
              <div className="chat-actions">
                <i
                  className="bi bi-three-dots-vertical"
                  onClick={() => setShowMenu((prev) => !prev)}
                ></i>

                {showMenu && (
                  <div className="chat-dropdown">
                    <div onClick={() => handleBlock(userId)}>Block</div>
                    <div onClick={() => handleDelete(userId)}>Delete Chat</div>
                    <div onClick={() => handleReport(userId)}>Report</div>
                  </div>
                )}
              </div>
            </nav>

            <div className="dm-chat-body" ref={chatRef}>
              {loading ? (
                <div className="chat-loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">Start chatting ✨</div>
              ) : (
                messages.map((msg, index) => {
                  const senderUsername = msg.from;
                  const isCurrentUser = senderUsername === currentUser;
                  const senderProfile = userProfiles[senderUsername];

                  return (
                    <div
                      key={`${msg.from}-${msg.message}-${index}`}
                      className={`dm-message ${isCurrentUser ? "sent" : "received"}`}
                    >
                      {!isCurrentUser && (
                        <div className="message-sender-info">
                          <img
                            src={senderProfile?.avatarUrl || "/pfps/pfp1.jpg"}
                            alt={senderUsername}
                            className="message-avatar"
                          />
                          <span className="dm-sender">@{senderUsername}</span>
                        </div>
                      )}
                      <div className="dm-bubble">{msg.message}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="dm-input-area">
              <button
                className="emoji-btn"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                😊
              </button>

              {showEmojiPicker && (
                <div className="emoji-popup" ref={emojiRef}>
                  <div className="emoji-header">
                    <span>Select Emoji</span>
                    <button onClick={() => setShowEmojiPicker(false)}>
                      ❌
                    </button>
                  </div>
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}

              <input
                type="text"
                placeholder={t("chatPage.typeMessage")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />

              <button className="send-button" onClick={sendMessage}>
                {t("chatPage.send")}
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

export default ChatPage;
