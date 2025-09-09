import React, { useState, useEffect } from "react";
import "../cssfiles/search.css";
import "../cssfiles/layout.css";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import API_URL from '../utils/api';

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const username = sessionStorage.getItem("username");

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim() === "") {
        setResults([]);
        return; // stop fetch if input is empty
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`, {
          headers: {
            authorization: sessionStorage.getItem("token"),
          },
        });

        const data = await res.json();
        console.log(data); 
        
        if (res.ok) {
  const users = (data.users || []).map(u => ({ ...u, type: "user" }));
  const posts = (data.posts || []).map(p => ({ ...p, type: "post" }));
  setResults([...users, ...posts]);
}
 else {
          setResults([]);
        }
      } catch (err) {
        console.error("Search failed:", err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return(
        <div className='SearchPage'>
        <img
            src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
            alt="wallpaper"
            className="bg-image"
        />

        <nav className='Navbar'>
            {t('searchPage.title')}
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
          <div className="search-bar">
            <input
              type="text"
              placeholder={t('searchPage.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="search-result">
            {loading && <div className="result">{t('searchPage.loading')}</div>}
            {!loading && results.length === 0 && query && (
              <div className="result">{t('searchPage.noResults')}</div>
            )}
            {results.map((item, index) => (
  <div className="result" key={index}>
    <img
      src={item.avatar_url || "/default-avatar.png"}
      alt={`${item.username || "user"}'s avatar`}
      className="search-avatar"
    />
    <div className="search-text">
      {item.type === "user" ? (
        <>
          <Link to={`/profile/${item.username}`} className="username-link">
  <strong>@{item.username}</strong>
</Link>

          <span>{item.bio || ""}</span>
        </>
      ) : (
        <>
          <Link to={`/profile/${item.username}`} className="username-link">
  <strong>@{item.username}</strong>
</Link>

          <span>{item.content}</span>
        </>
      )}
    </div>
  </div>
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

export default Search;