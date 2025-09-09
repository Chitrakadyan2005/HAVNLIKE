import React, { useState } from 'react';
import '../cssfiles/Username.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Username() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState('');
  const { t } = useTranslation();

  const handleUsername = async () => {
    if (!username.trim()) {
      Swal.fire({
        title: 'Oops 😢',
        text: t('username.inputName'),
        background: '#fff0f6',
        confirmButtonColor: '#d63384'
      });
      return;
    }

    if ((!isReturningUser && (!secretPhrase || secretPhrase.trim().length < 6)) ||
      (isReturningUser && !secretPhrase)) {
      Swal.fire({
        title: t('username.enterSecret'),
        text: isReturningUser
          ? t('username.enterSecret')
          : t('username.createSecret'),
        background: '#fff0f6',
        confirmButtonColor: '#d63384'
      });
      return;
    }

    try {
      const endpoint = isReturningUser ? '/api/auth/login' : '/api/auth/register';
      const body = { username, secret_phrase: secretPhrase };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();

      if (!isReturningUser) {
        Swal.fire({
          title: 'Your Secret Phrase',
          html: `Write this down to recover your account:<br><strong>${data.secret_phrase}</strong>`,
          icon: 'warning',
          background: '#fff0f6',
          confirmButtonColor: '#d63384',
          confirmButtonText: 'I saved it!'
        });
      }

      // Clear any existing localStorage data to prevent conflicts
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      
      // Store in sessionStorage for per-tab isolation
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('username', data.username);
      console.log('✅ Login successful for user:', data.username);
      // Connect socket with this tab's identity
      try {
        const { refreshSocketAuth } = await import('../socket');
        refreshSocketAuth();
      } catch {}
      navigate('/home');

    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        background: '#fff0f6',
        confirmButtonColor: '#d63384'
      });
    }
  };

  return (
    <div className="username-page">
      <img
        src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
        alt="wallpaper"
        className="bg-image"
      />
      <div className="username-content">
        <h2>
          {isReturningUser ? t('username.headingReturning') : t('username.headingNew')}
        </h2>

        <input
          type="text"
          placeholder={t('username.inputName')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="username-input"
        />

        {!isReturningUser && (
          <input
            type="text"
            placeholder={t('username.createSecret')}
            value={secretPhrase}
            onChange={(e) => setSecretPhrase(e.target.value)}
            className="username-input"
            minLength={6}
          />
        )}

        {isReturningUser && (
          <input
            type="text"
            placeholder={t('username.enterSecret')}
            value={secretPhrase}
            onChange={(e) => setSecretPhrase(e.target.value)}
            className="username-input"
            minLength={5}
          />
        )}

        <button className="username-btn" onClick={handleUsername}>
          {isReturningUser ? t('username.login') : t('username.continue')}
        </button>

        <p className="toggle-mode" onClick={() => setIsReturningUser(!isReturningUser)}>
          {isReturningUser ? t('username.toggleToRegister') : t('username.toggleToLogin')}
        </p>
      </div>
    </div>
  );
}

export default Username;
