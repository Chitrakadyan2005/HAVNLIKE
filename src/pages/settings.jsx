import React, {useState, useRef, useEffect} from 'react';
import { Link } from 'react-router-dom';
import '../cssfiles/settings.css';
import '../cssfiles/layout.css';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import API_URL from '../utils/api';


function Settings() {
  const[showOptions, setShowOptions] = useState(false);
  const[isPrivate, setIsPrivate] = useState(true);
  const dropdownRef = useRef();
  const username = sessionStorage.getItem("username");
  

  const { t } = useTranslation();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

const handleDeleteAccount = () => {
  setConfirmMessage("This will permanently delete your account. Are you sure?");
  setConfirmAction('delete');
  setShowConfirmModal(true);
};


  const handleLogout = () => {
    setConfirmMessage("Are you sure you want to log out?");
    setConfirmAction('logout');
    setShowConfirmModal(true);
  };


  useEffect(() => {
    function handleClickOutside(event){
      if(dropdownRef.current && !dropdownRef.current.contains(event.target)){
        setShowOptions(false);
      }
    }
    document.addEventListener('mousedown',handleClickOutside);
    return () => document.removeEventListener('mousedown',handleClickOutside);
  },[]);

  const handleConfirm = async () => {
    if (confirmAction === 'logout') {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
      alert('Logged out successfully');
      window.location.href = '/';
    } else if (confirmAction === 'delete') {
      try {
        const token = sessionStorage.getItem("token");
        console.log("Token from sessionStorage:", token);
        const response = await fetch(`${API_URL}/api/auth/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (response.ok) {
          alert('Account deleted successfully');
          window.location.href = '/';
        } else {
          const data = await response.json();
          alert(`Failed to delete account: ${data.error || data.message}`);
        }
      } catch (error) {
        alert('Something went wrong!');
        console.error(error);
      }
    }
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const handleToggle = () => {
    setShowOptions(!showOptions);
  };

  const handleSelection = (privacySetting) => {
    setIsPrivate(privacySetting === 'private');
    setShowOptions(false);
  };

  return (
    <div className='SettingsPage'>
      <img
        src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
        alt="wallpaper"
        className="bg-image"
      />
      <nav className='Navbar'>{t('home.navbar')}</nav>

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

        <section className="feed settings-feed">
  <div className="feed-wrapper">
    <h2>{t('settings.title')}</h2>

    <div className="settings-option">
      <i className="bi bi-person-circle"></i>
      <div>
        <h4>{t('settings.profile')}</h4>
        <p>{t('settings.profileDesc')}</p>
      </div>
      {/* Edit ko bhi button class de diya */}
      <Link to={`/profile/${username}`} className="btn">
        Edit
      </Link>
    </div>

    <div className="settings-option">
      <i className="bi bi-shield-lock-fill"></i>
      <div>
        <h4>{t('settings.privacy')}</h4>
        <p>{t('settings.privacyDesc')}</p>
        <p>
          <strong>{t('settings.currently')} :</strong>{' '}
          {isPrivate ? 'Private 🔒' : 'Public 🌍'}
        </p>
      </div>
      <button className="btn" onClick={handleToggle}>
        Toggle
      </button>

      {showOptions && (
        <div className="privacy-dropdown">
          <button
            onClick={() => handleSelection('private')}
            className={isPrivate ? 'active' : ''}
          >
            {t('settings.private')}
          </button>
          <button
            onClick={() => handleSelection('public')}
            className={!isPrivate ? 'active' : ''}
          >
            {t('settings.public')}
          </button>
        </div>
      )}
    </div>

    <div className="settings-option">
      <i className="bi bi-translate"></i>
      <div>
        <h4>{t('settings.language')}</h4>
        <p>{t('settings.languageDesc')}</p>
      </div>
      <select
        className="dropdown"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
        <option value="pt">Portuguese</option>
        <option value="ru">Russian</option>
        <option value="ar">Arabic</option>
        <option value="zh">Chinese</option>
        <option value="bn">Bengali</option>
        <option value="ur">Urdu</option>
      </select>
    </div>

    <div className="settings-option">
      <i className="bi bi-bell-fill"></i>
      <div>
        <h4>{t('settings.notifications')}</h4>
        <p>{t('settings.notificationsDesc')}</p>
      </div>
      <button className="btn">{t('settings.manage')}</button>
    </div>

      {/** 
    <div className="settings-option">
      <i className="bi bi-brightness-high-fill"></i>
      <div>
        <h4>{t('settings.theme')}</h4>
        <p>{t('settings.themeDesc')}</p>
      </div>
      <button className="btn">{t('settings.switch')}</button>
    </div>
        */}

    <div className="settings-option">
      <i className="bi bi-person-x-fill"></i>
      <div>
        <h4>{t('settings.account')}</h4>
        <p>{t('settings.accountDesc')}</p>
      </div>
      {/* Danger class rakhi hai consistency ke liye */}
      <button className="btn danger" onClick={handleDeleteAccount}>
        {t('settings.delete')}
      </button>
    </div>

    <div className="settings-option logout">
      <i className="bi bi-box-arrow-right"></i>
      <div>
        <h4>{t('settings.logout')}</h4>
        <p>{t('settings.logoutDesc')}</p>
      </div>
      <button className="btn" onClick={handleLogout}>
        {t('settings.logout')}
      </button>
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

      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p>{confirmMessage}</p>
            <div className="modal-buttons">
              <button className="btn cancel" onClick={handleCancel}>Cancel</button>
              <button className={`btn confirm ${confirmAction === 'delete' ? 'danger' : ''}`} onClick={handleConfirm}>{confirmAction === 'logout' ? 'Logout' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;
