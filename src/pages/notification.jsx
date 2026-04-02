import React, { useState, useEffect } from "react";
import "../cssfiles/notification.css";
import "../cssfiles/layout.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_URL from "../utils/api";

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const { t } = useTranslation();
  const username = sessionStorage.getItem("username");
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem("token"); // change if you store token differently
        const res = await fetch(`${API_URL}/api/notification`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          console.error("Unexpected data:", data);
          setNotifications([]); // or handle error state
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const markAsRead = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      await fetch(`${API_URL}/api/notification/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHasUnread(false);
    };

    markAsRead();
  }, []);

  const acceptFollow = async (fromUserId, notificationId) => {
    try {
      const token = sessionStorage.getItem("token");

      await fetch(`${API_URL}/api/notification/follow/accept/${fromUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // remove notification from UI
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Accept follow failed", err);
    }
  };

  const rejectFollow = async (fromUserId, notificationId) => {
    try {
      const token = sessionStorage.getItem("token");

      await fetch(`${API_URL}/api/notification/follow/reject/${fromUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Reject follow failed", err);
    }
  };

  const acceptDM = async (fromUserId, notificationId) => {
    try {
      const token = sessionStorage.getItem("token");

      await fetch(`${API_URL}/api/dm/request/accept/${fromUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetch(`${API_URL}/api/notification/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHasUnread(false);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Accept DM failed", err);
    }
  };

  const rejectDM = async (fromUserId, notificationId) => {
    try {
      const token = sessionStorage.getItem("token");

      await fetch(`${API_URL}/api/dm/request/reject/${fromUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetch(`${API_URL}/api/notification/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHasUnread(false);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Reject DM failed", err);
    }
  };

  const renderActions = (n) => {
    if (n.type === "follow_request") {
      return (
        <div className="notification-actions">
          <button onClick={() => acceptFollow(n.from_user_id, n.id)}>
            Accept
          </button>
          <button onClick={() => rejectFollow(n.from_user_id, n.id)}>
            Reject
          </button>
        </div>
      );
    }

    if (n.type === "dm_request") {
      return (
        <div className="notification-actions">
          <button onClick={() => acceptDM(n.from_user_id, n.id)}>Accept</button>
          <button onClick={() => rejectDM(n.from_user_id, n.id)}>Reject</button>
        </div>
      );
    }

    if (n.type === "dm_accepted" || n.type === "dm_rejected") {
      return <span className="notification-status">{n.message}</span>;
    }

    return null;
  };

  const filtered = Array.isArray(notifications)
    ? notifications.filter((item) =>
        item.message?.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <div className="notificationPage">
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
          {filtered.map((n) => (
            <div className="post" key={n.id}>
              <div className="post-header">
                <div className="notif-user">
                  <img
                    src={n.avatar_url || "/pfps/default.png"}
                    alt={n.from_username}
                    className="notif-avatar"
                  />
                  <h3>{n.from_username}</h3>
                </div>
                <span className="post-time">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              <div className="post-body">
                <p>{n.message}</p>
                {renderActions(n)}
              </div>
            </div>
          ))}
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

export default Notification;
