import React,{useEffect, useState} from "react";
import '../cssfiles/layout.css';
import '../cssfiles/dm.css';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import socket from "../socket";
import API_URL from '../utils/api';

function Dm(){
    const[conversations, setConversations] = useState([]);
    const[query, setQuery] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const username = sessionStorage.getItem("username");

    const handleChatClick = (chatUser) => {
    // Navigate to chat page with that user's ID and username
    navigate(`/dm/chatpage/${chatUser.id}/${chatUser.username}`);
  };


 useEffect(() => {
  // Join DM room for current user
  socket.emit('join-dm', username);

  // Listen for new DM messages
  socket.on('receive-dm', (msg) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.username === (msg.from === username ? msg.to : msg.from));
      if (idx !== -1) {
        // Update existing conversation
        const updated = [...prev];
        updated[idx].lastMessage = msg.text;
        updated[idx].time = msg.timestamp || new Date().toLocaleTimeString();
        return updated;
      } 
      // New conversation
      return [{ username: msg.from === username ? msg.to : msg.from, lastMessage: msg.text, time: msg.timestamp, avatar: msg.avatar }, ...prev];
    });
  });

  return () => socket.off('receive-dm');
}, []);

    useEffect(() => {
  const fetchConversations = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const res = await fetch(`${API_URL}/api/dm/chat/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await res.json();
      console.log('Conversations data:', data); // Debug log to see if avatars are coming
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations: ', err);
    }
  };
  fetchConversations();
}, []);



  return(
        <div className='dmPage'>
        <img
            src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
            alt="wallpaper"
            className="bg-image"
        />

        <nav className='Navbar'>
            {t('home.navbar')}
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
                                    
                    <Link to={`/profile/${username}`} style={{ textDecoration: 'none' }}>
                      <li style={{ '--i': '#c471f5', '--j': '#fa71cd' }}>
                        <div className="icon"><i className="bi bi-person"></i></div>
                        <span className="title">{t('home.tabs.profile')}</span>
                      </li>
                    </Link>
                </ul>
            </aside>

            <section className="feed">
  <h2 className="dm-heading">{t('dm.heading')}</h2>
  <div className="chat-list">
    {conversations
      .filter(conv => 
        conv?.username?.toLowerCase().includes(query.toLowerCase()) ||
        conv?.lastMessage?.toLowerCase().includes(query.toLowerCase())
      )
      .map((conv, index) => (
        <Link 
          key={index} 
          to={`/dm/chatpage/${conv.id}/${conv.username}`} 
          className="chat-card"
        >
          <img 
            src={conv.avatar || "/pfps/pfp1.jpg"} 
            alt={conv.username}
            className="chat-avatar"
          />
          <div className="chat-info">
            <h4>{conv.username}</h4>
            <p>{conv.lastMessage || t('dm.noMessages')}</p>
          </div>
          <span className="chat-time">{conv.time || t('dm.now')}</span>
        </Link>
      ))}
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
        </div>
    )
}

export default Dm;
