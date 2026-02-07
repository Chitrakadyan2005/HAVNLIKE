import React from "react";

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../cssfiles/App.css';

function App() {
  const navigate = useNavigate();
  const { t } = useTranslation();
 
 
  const handleJoinClick = () => {
    navigate('/username'); 
  };


  return (
    <div className="hero">
      <img
        src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
        alt="wallpaper"
        className="bg-image"
      />
      <div className="content">
        <h1>{t('app.title')}</h1>
        <p>{t('app.tagline')}</p>
        <button className="join-btn" onClick={handleJoinClick}>
          {t('app.join')}
        </button>
      </div>
    </div>
  );
}

export default App;
