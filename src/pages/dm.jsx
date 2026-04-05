import React, { useEffect, useState } from "react";
import "../cssfiles/layout.css";
import "../cssfiles/dm.css";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import socket from "../socket";
import API_URL from "../utils/api";

function Dm() {
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showDmRequestModal, setShowDmRequestModal] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

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
    const storedUsername = sessionStorage.getItem("username");
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedUsername || !storedUserId) {
      navigate("/login");
      return;
    }

    setUsername(storedUsername);
    setUserId(Number(storedUserId));
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    socket.emit("join-dm", userId);

    socket.on("dm-error", (e) => {
      if (e.requestRequired) {
        alert("This user only accepts DMs from followers / mutuals");
      }
    });

    socket.on("receive-dm", (msg) => {
      setConversations((prev) => {
        const otherUserId = msg.from === userId ? msg.to : msg.from;

        const updatedConv = {
          id: otherUserId,
          username: msg.otherUsername,
          lastMessage: msg.message,
          time: msg.created_at || new Date().toLocaleTimeString(),
          avatar: msg.avatar,
          isUnread: msg.to === userId,
        };

        const filtered = prev.filter((c) => c.id !== otherUserId);

        return [updatedConv, ...filtered];
      });
    });

    return () => {
      socket.off("dm-error");
      socket.off("receive-dm");
    };
  }, [userId]);

  const handleOpenChat = async (conv) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/dm/can-dm/${conv.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.requestRequired) {
          alert("This user only accepts messages from followers");
          return;
        }
        throw new Error(data.error);
      }

      navigate(`/dm/chatpage/${conv.id}/${conv.username}`);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/dm/chat/list`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const data = await res.json();
        console.log("Conversations data:", data); // Debug log to see if avatars are coming
        setConversations(
          data.map((conv) => ({
            id: conv.id,
            username: conv.username,
            avatar: conv.avatar,
            lastMessage: conv.lastMessage || "Start chatting ✨",
            time: conv.time,
            isUnread: false,
          })),
        );
      } catch (err) {
        console.error("Error fetching conversations: ", err);
      }
    };
    fetchConversations();
  }, []);

  if (!username) return null;

  const token = sessionStorage.getItem("token");

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this chat?")) return;

    try {
      await fetch(`${API_URL}/api/dm/chat/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setConversations((prev) => prev.filter((c) => c.id !== userId));
    } catch (err) {
      alert("Failed to delete chat");
    }
  };

  const handleBlock = async (userId) => {
    if (!window.confirm("Block this user?")) return;

    try {
      await fetch(`${API_URL}/api/dm/block/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setConversations((prev) => prev.filter((c) => c.id !== userId));
    } catch (err) {
      alert("Failed to block user");
    }
  };

  const handleReport = async (userId) => {
    try {
      await fetch(`${API_URL}/api/dm/report/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "spam/abuse" }),
      });

      alert("User reported");
    } catch (err) {
      alert("Failed to report");
    }
  };

  return (
    <div className="dmPage">
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
          <h2 className="dm-heading">{t("dm.heading")}</h2>
          <div className="chat-list">
            {conversations
              .filter(
                (conv) =>
                  conv?.username?.toLowerCase().includes(query.toLowerCase()) ||
                  conv?.lastMessage
                    ?.toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((conv, index) => (
                <div
                  key={conv.id}
                  className="chat-card"
                  onClick={() => handleOpenChat(conv)}
                >
                  <img
                    src={conv.avatar || "/pfps/pfp1.jpg"}
                    alt={conv.username}
                    className="chat-avatar"
                  />
                  <div className="chat-info">
                    <h4>{conv.username}</h4>
                    <p className={conv.isUnread ? "unread-msg" : ""}>
                      {conv.lastMessage || t("dm.noMessages")}
                    </p>
                  </div>
                  <div className="chat-actions">
                    <span className="chat-time">
                      {conv.time || t("dm.now")}
                    </span>

                    <div className="menu-wrapper">
                      <i
                        className="bi bi-three-dots-vertical menu-icon"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div
                        className="menu-dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div onClick={() => handleDelete(conv.id)}>
                          Delete Chat
                        </div>
                        <div onClick={() => handleBlock(conv.id)}>
                          Block User
                        </div>
                        <div onClick={() => handleReport(conv.id)}>Report</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

export default Dm;
