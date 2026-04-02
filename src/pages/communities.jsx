import "../cssfiles/communities.css";
import "../cssfiles/layout.css";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_URL from "../utils/api";

function Community() {
  const { t } = useTranslation();

  const username = sessionStorage.getItem("username");

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

  const communities = [
    {
      id: "second-shift",
      name: "The Second Shift 🏠",
      description: "Domestic work, expectations, and the work nobody counts.",
      allowAbuse: false,
    },
    {
      id: "crossed-boundaries",
      name: "Crossed Boundaries 🚧",
      description:
        "Everyday safety, experiences, and knowing when lines are crossed.",
      allowAbuse: false,
    },
    {
      id: "the-pattern",
      name: "The Pattern 🧠",
      description:
        "Gender roles, patriarchy, and the systems we keep noticing.",
      allowAbuse: false,
    },
    {
      id: "the-climb",
      name: "The Climb 📈",
      description: "Careers, ambition, workplace bias, and growth.",
      allowAbuse: false,
    },
    {
      id: "mixed-signals",
      name: "Mixed Signals 💬",
      description: "Dating, relationships, and emotional labour.",
      allowAbuse: false,
    },
    {
      id: "life-lately",
      name: "Life Lately 🌱",
      description: "Burnout, confusion, growth, and everything in between.",
      allowAbuse: false,
    },
    {
      id: "no-filter",
      name: "No Filter 🔥",
      description:
        "Unfiltered venting. Strong language allowed. Say what you need to.",
      allowAbuse: true,
    },
  ];

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
          {/* Sidebar */}
          <ul className="leftpanel-animated">
            
            <Link to="/room">
              <li style={{ "--i": "#80FF72", "--j": "#7EE8FA" }}>
                <div className="icon">
                  <i className="bi bi-tv"></i>
                </div>
                <span className="title">{t("home.tabs.room")}</span>
              </li>
            </Link>
            <Link to="/search">
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
            <Link to="/dm">
              <li style={{ "--i": "#ffa9c6", "--j": "#f434e2" }}>
                <div className="icon">
                  <i className="bi bi-chat-dots"></i>
                </div>
                <span className="title">{t("home.tabs.dm")}</span>
              </li>
            </Link>
            <Link to="/notification">
              <li style={{ "--i": "#f6d365", "--j": "#fda085" }}>
                <div className="notification-icon-wrapper">
                  <i className="bi bi-bell"></i>
                  {hasUnread && <span className="notif-dot"></span>}
                </div>
                <span className="title">{t("home.tabs.notification")}</span>
              </li>
            </Link>
            <Link to="/settings">
              <li style={{ "--i": "#84fab0", "--j": "#8fd3f4" }}>
                <div className="icon">
                  <i className="bi bi-gear"></i>
                </div>
                <span className="title">{t("home.tabs.settings")}</span>
              </li>
            </Link>
            <Link to={`/profile/${username}`}>
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
          <div className="community-grid">
            {communities.map((c) => (
              <div key={c.id} className="community-card">
                <h3>{c.name}</h3>
                <p className="community-desc">{c.description}</p>

                <div className="community-actions">
                  <Link to={`/community/${c.id}`}>
                    <button className="join-btn">Join Community</button>
                  </Link>
                  <Link to={`/community/${c.id}/bot`}>
                    <button className="bot-btn">Talk to Bot</button>
                  </Link>
                </div>

                {c.allowAbuse && (
                  <span className="community-warning">
                    ⚠️ Unfiltered venting allowed here only
                  </span>
                )}
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

export default Community;
