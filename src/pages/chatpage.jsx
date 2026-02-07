import React, { useState, useEffect, useRef } from "react";
import '../cssfiles/layout.css';
import '../cssfiles/chatPage.css';
import { Link, useParams } from 'react-router-dom';
import EmojiPicker from "emoji-picker-react";
import { useTranslation } from 'react-i18next';
import socket from "../socket";
import API_URL from '../utils/api';

function ChatPage() {
    const { userId, username } = useParams();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [userProfiles, setUserProfiles] = useState({}); // Cache for multiple user profiles
    const { t } = useTranslation();

    const currentUser = sessionStorage.getItem("username");
    const token = sessionStorage.getItem("token");

    const emojiRef = useRef();

    // Function to fetch user profile by username
    const fetchUserProfile = async (username) => {
        if (userProfiles[username]) return userProfiles[username]; // Return cached profile
        
        try {
            const response = await fetch(`${API_URL}/api/profile/${username}`, {
                method: "GET",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });
            
            if (response.ok) {
                const profile = await response.json();
                console.log(`Profile for ${username}:`, profile); // Debug log
                setUserProfiles(prev => ({ ...prev, [username]: profile }));
                return profile;
            }
        } catch (err) {
            console.error(`Error fetching profile for ${username}:`, err);
        }
        return null;
    };



    useEffect(() => {
    // Join apne naam ka DM room
    socket.emit("join-dm", currentUser);

    // Jab koi message mile (normalize payload to { from, message })
    socket.on("receive-dm", (msg) => {
      const normalized = msg?.text ? { from: msg.from, message: msg.text } : msg;
      setMessages((prev) => [...prev, normalized]);
    });

    return () => {
      socket.off("receive-dm");
    };
  }, []);

    // 📩 Fetch chat and user profile
useEffect(() => {
  if (!userId) return;

  const token = sessionStorage.getItem("token");
  if (!token) {
    console.error("⚠️ No token found in sessionStorage");
    return;
  }

  // Fetch chat messages
  fetch(`${API_URL}/api/dm/chat/${userId}`, {
    method: "GET",
    headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log('Messages data:', data); // Debug log
      setMessages(data);
      // Fetch profiles for all unique users in the chat
      const uniqueUsers = [...new Set(data.map(msg => msg.from || msg.sender_id))];
      console.log('Unique users:', uniqueUsers); // Debug log
      uniqueUsers.forEach(user => {
        if (user && user !== currentUser) {
          fetchUserProfile(user);
        }
      });
    })
    .catch(err => {
      console.error("Chat fetch error:", err.message);
      setMessages([]);
    });

  // Fetch user profile for avatar
  fetch(`${API_URL}/api/profile/${username}`, {
    method: "GET",
    headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => setUserProfile(data))
    .catch(err => {
      console.error("Profile fetch error:", err.message);
      setUserProfile(null);
    });
}, [userId, username]);


    // 📤 Send message
    const sendMessage = () => {
  if (!message.trim()) return;

  const newMessage = {
    receiverId: userId,
    message
  };

  // Optimistically render on sender side
  setMessages((prev) => [...prev, { from: currentUser, message }]);

  // Emit so receiver sees instantly
  socket.emit("send-dm", newMessage);
  setMessage("");

  // Persist, but don't replace the local message list (avoid flicker/overwrite)
  fetch(`${API_URL}/api/dm/chat/send`, {
    method: 'POST',
    headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
    },
    body: JSON.stringify(newMessage)
  })
    .then(() => {})
    .catch(err => console.error("Failed to send message:", err));
};


    const onEmojiClick = (emojiData) => {
        setMessage(prev => prev + emojiData.emoji);
    };

    return (
        <div className='chatPage'>
                <img
                    src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
                    alt="wallpaper"
                    className="bg-image"
                />
        
                <nav className='Navbar'>
                    {t('chatPage.title')}
                </nav>
                <div className='main-content'>
                    <aside className='left-panel'>
                        <ul className='leftpanel-animated'>
                            <Link to="/home" style={{ textDecoration: 'none' }}>
                                                        <li style={{ '--i': '#a955ff', '--j': '#ea51ff' }}>
                                                            <div className="icon"><i className="bi bi-house"></i></div>
                                                            <span className="title">{t('home.tabs.home')}</span>
                                                        </li>
                                                    </Link>
                            
                                                    <Link to="/search" style={{ textDecoration: 'none' }}>
                                                        <li style={{ '--i': '#56CCF2', '--j': '#2F80ED' }}>
                                                            <div className="icon"><i className="bi bi-search"></i></div>
                                                            <span className="title">{t('home.tabs.search')}</span>
                                                        </li>
                                                    </Link>
                            
                                                    <Link to="/room" style={{ textDecoration: 'none' }}>
                                                        <li style={{ '--i': '#80FF72', '--j': '#7EE8FA' }}>
                                                            <div className="icon"><i className="bi bi-tv"></i></div>
                                                            <span className="title">{t('home.tabs.room')}</span>
                                                        </li>
                                                    </Link>
                            
                                                    <Link to="/dm" style={{ textDecoration: 'none' }}>
                                                        <li style={{ '--i': '#ffa9c6', '--j': '#f434e2' }}>
                                                            <div className="icon"><i className="bi bi-chat-dots"></i></div>
                                                            <span className="title">{t('home.tabs.dm')}</span>
                                                        </li>
                                                    </Link>
                            
                                                    <Link to="/notification" style={{ textDecoration: 'none' }}>
                                                        <li style={{ '--i': '#f6d365', '--j': '#fda085' }}>
                                                            <div className="icon"><i className="bi bi-bell"></i></div>
                                                            <span className="title">{t('home.tabs.notification')}</span>
                                                        </li>
                                                    </Link>
                            
                                                    <Link to="/settings" style={{ textDecoration: 'none' }}>
                                                        <li style={{ '--i': '#84fab0', '--j': '#8fd3f4' }}>
                                                            <div className="icon"><i className="bi bi-gear"></i></div>
                                                            <span className="title">{t('home.tabs.settings')}</span>
                                                        </li>
                                                    </Link>
                            
                                                    <Link to={`/profile/${currentUser}`} style={{ textDecoration: 'none' }}>
                                                        <li style={{ '--i': '#c471f5', '--j': '#fa71cd' }}>
                                                            <div className="icon"><i className="bi bi-person"></i></div>
                                                            <span className="title">{t('home.tabs.profile')}</span>
                                                        </li>
                                                    </Link>
                        </ul>
                    </aside>
        
                    <section className="feed">
                    <div className="dm-chat-container">
                        <nav className="dm-navbar">
                            <Link to="/dm" className="back-btn">←</Link>
                            <div className="chat-user-info">
                                <img 
                                    src={userProfile?.avatarUrl || "/pfps/pfp1.jpg"} 
                                    alt={username}
                                    className="chat-navbar-avatar"
                                />
                                <Link to={`/profile/${username}`} className="chat-username-link">
                                    <h3>@{username}</h3>
                                </Link>
                            </div>
                        </nav>

                        <div className="dm-chat-body">
                            {messages.map((msg, index) => {
                                const senderUsername = msg.from || msg.sender_id;
                                const isCurrentUser = senderUsername === currentUser;
                                const senderProfile = userProfiles[senderUsername];
                                
                                return (
                                    <div key={index} className={`dm-message ${isCurrentUser ? 'sent' : 'received'}`}>
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
                                        <div className="dm-bubble">
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="dm-input-area">
                            <button className="emoji-btn" onClick={() => setShowEmojiPicker(prev => !prev)}>😊</button>

                            {showEmojiPicker && (
                                <div className="emoji-popup" ref={emojiRef}>
                                    <div className="emoji-header">
                                        <span>Select Emoji</span>
                                        <button onClick={() => setShowEmojiPicker(false)}>❌</button>
                                    </div>
                                    <EmojiPicker onEmojiClick={onEmojiClick} />
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder={t('chatPage.typeMessage')}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />

                            <button className="send-button" onClick={sendMessage}>{t('chatPage.send')}</button>
                        </div>
                    </div>
                </section>

        
                    <aside className="right-panel">
                        <p className="welcome-text">
                            {t('home.greeting')}
                        </p>

                        <div className="reach-out">
                        <span>{t('home.reachOut')}</span>
                        <a 
                            href="https://instagram.com/yourusername" 
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
                        <Link to="/home" style={{ textDecoration: "none" }}>
                          <li style={{ "--i": "#a955ff", "--j": "#ea51ff" }}>
                            <div className="icon">
                              <i className="bi bi-house"></i>
                            </div>
                            <span className="title">{t("home.tabs.home")}</span>
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
                        <Link to="/room" style={{ textDecoration: "none" }}>
                          <li style={{ "--i": "#80FF72", "--j": "#7EE8FA" }}>
                            <div className="icon">
                              <i className="bi bi-tv"></i>
                            </div>
                            <span className="title">{t("home.tabs.room")}</span>
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
                            <div className="icon">
                              <i className="bi bi-bell"></i>
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
                        <Link to={`/profile/${username}`} style={{ textDecoration: 'none' }}>
                                                <li style={{ '--i': '#c471f5', '--j': '#fa71cd' }}>
                                                    <div className="icon"><i className="bi bi-person"></i></div>
                                                    <span className="title">{t('home.tabs.profile')}</span>
                                                </li>
                                            </Link>
                      </nav>
                </div>
    );
}

export default ChatPage;
