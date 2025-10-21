import '../cssfiles/room.css';
import '../cssfiles/layout.css';
import React, { useState , useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StreamRoomModal from '../components/StreamRoomModal';
import API_URL from '../utils/api';

function Room() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [voted, setVoted] = useState({});
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [selectedStreamRoom, setSelectedStreamRoom] = useState('');

  const username = sessionStorage.getItem("username");
  const token = sessionStorage.getItem("token");

  const navigate = useNavigate();
  const { t } = useTranslation();

    const handleTabClick = (roomName) => {
    // agar same tab pe click kare toh close kar do
    if (selectedRoom === roomName) {
      setSelectedRoom(null);
    } else {
      setSelectedRoom(roomName);
    }
  };

 useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/suggestions`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch suggestions");
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };

    if (token) fetchSuggestions();
  }, [token]);

const handleVote = async (id, type) => {
  if (voted[id]) {
    alert("You already voted!");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/suggestions/${id}/vote`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,   // 👈 send token here
      },
      body: JSON.stringify({ vote: type }), // backend expects "vote", not "type"
    });

    if (!response.ok) throw new Error("Failed to vote");

    const updated = await response.json();

    setSuggestions(suggestions.map(s =>
      s.id === id ? { ...s, yes_count: updated.yes_count, no_count: updated.no_count } : s
    ));

    setVoted({ ...voted, [id]: type });
  } catch (err) {
    console.error("Error voting:", err);
  }
};




  const handleSuggestionSend = async () => {
    if (!suggestionText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ suggestion: suggestionText }),
      });

      if (!response.ok) throw new Error("Failed to send suggestion");
      const data = await response.json();

      setSuggestionText('');
      setSuggestions((prev) => [data, ...prev]); // prepend because of DESC
    } catch (error) {
      console.error("Error sending suggestion:", error);
    }
  };

  const handleStreamRoomClick = (roomName) => {
    setSelectedStreamRoom(roomName);
    setShowStreamModal(true);
    setSelectedRoom(null); // Close the regular room popup
  };

  const handleCreateRoom = async (roomCode, roomName) => {
    try {
      // Create room in backend
      const response = await fetch(`${API_URL}/api/stream-rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          roomCode, 
          roomName, 
          createdBy: username 
        }),
      });

      if (!response.ok) throw new Error("Failed to create room");
      
      setShowStreamModal(false);
      
      // Navigate to stream room with room code
      navigate(`/room/${roomName}/stream`, {
        state: { 
          roomName, 
          roomCode, 
          isHost: true 
        }
      });
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    }
  };

  const handleJoinRoom = async (roomCode, roomName) => {
    try {
      // Verify room exists in backend
      const response = await fetch(`${API_URL}/api/stream-rooms/${roomCode}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("Room not found. Please check the room code.");
        return;
      }

      const roomData = await response.json();
      
      setShowStreamModal(false);
      
      // Navigate to stream room with room code
      navigate(`/room/${roomName}/stream`, {
        state: { 
          roomName, 
          roomCode, 
          isHost: false,
          hostUsername: roomData.createdBy
        }
      });
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please try again.");
    }
  };


   const rooms = [
    'Self-Care & Serenity 🧘‍♀️',
    'Body Love 💗',
    'K-pop Crush 🎶',
    'K-Drama Feels 🎬',
    'Broken Bonds 💔',
    'Solo Escapes ✈️',
    'Swipe Stories 📱',
    'Hustle & Heart 💼',
    '2025 Fashion Files 👗',
    'Glow Up Goals 🌟',
    'Bookie Girlies 📚'
  ];

    return(
        <div className='RoomPage'>
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

            <section className='feed'>
          {rooms.map((tabName, index) => (
            <div
              key={index}
              className='room-tab'
              onClick={() => handleTabClick(tabName)}
            >
              {selectedRoom === tabName ? (
                <div className='popup-box-inline'>
                  <h3>{t('room.enter')} {tabName}</h3>
                  <p>{t('room.joinPrompt')}</p>
                  <div className='popup-options'>
                    <button onClick={() => navigate(`/room/${tabName}`)}>
                      {t('room.textChat')}
                    </button>
                    <button onClick={() => handleStreamRoomClick(tabName)}>
                      {t('room.streamRoom')}
                    </button>
                  </div>
                  <button
                    className='popup-close'
                    onClick={() => setSelectedRoom(null)}
                  >
                    {t('room.close')}
                  </button>
                </div>
              ) : (
                tabName
              )}
            </div>
          ))}

          {/* Suggestions list */}
          <div className="suggestions-list">
            <h3>All Suggestions 💡</h3>
            {suggestions.map((s) => (
              <div key={s.id} className="suggestion-item">
                <p>{s.text}</p>
                <div className="votes">
                  <button onClick={() => handleVote(s.id, "yes")}>👍 {s.yes_count}</button>
                  <button onClick={() => handleVote(s.id, "no")}>👎 {s.no_count}</button>
                </div>
              </div>
            ))}
          </div>

          <div className='suggestion-box'>
            <h3>Drop a Suggestion 💬</h3>
            <textarea
              placeholder='Write your idea, topic or thought here...'
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              className='suggestion-input'
            />
            <button
              className='suggestion-submit'
              onClick={handleSuggestionSend}
            >
              Send
            </button>
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

        {/* Stream Room Modal */}
        <StreamRoomModal
          isOpen={showStreamModal}
          onClose={() => setShowStreamModal(false)}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          roomName={selectedStreamRoom}
        />
        </div>
    )
}

export default Room;