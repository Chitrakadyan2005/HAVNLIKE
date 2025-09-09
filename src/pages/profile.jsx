import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../cssfiles/profile.css";
import "../cssfiles/layout.css";
import { useTranslation } from 'react-i18next';
import {jwtDecode} from "jwt-decode"; // ✅ fixed import

function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loggedInUsername, setLoggedInUsername] = useState(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  const presetAvatars = [
    '../pfps/pfp1.jpg',
    '../pfps/pfp2.jpg',
    '../pfps/pfp3.jpg',
    '../pfps/pfp4.jpg',
    '../pfps/pfp5.jpg',
    '../pfps/pfp6.jpg',
    '../pfps/pfp7.jpg',
    '../pfps/pfp8.jpg',
    '../pfps/pfp9.jpg',
    '../pfps/pfp10.jpg',
  ];

  // ✅ Get username from sessionStorage (primary) or decode token (fallback)
  useEffect(() => {
    const sessionUsername = sessionStorage.getItem("username");
    if (sessionUsername) {
      setLoggedInUsername(sessionUsername.toLowerCase());
    } else {
      // Fallback to token decoding if sessionStorage username is not available
      const token = sessionStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setLoggedInUsername(decoded.username?.toLowerCase());
        } catch (err) {
          console.error("Token decode failed:", err);
        }
      }
    }
  }, []);

  const handleAvatarClick = () => {
    if (isOwnProfile) setShowAvatarOptions(!showAvatarOptions);
  };

  const handleSelectAvatar = async (url) => {
    setProfile({ ...profile, avatarUrl: url });
    setShowAvatarOptions(false);

    try {
      await fetch(`http://localhost:5000/api/profile/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ avatarUrl: url }),
      });
    } catch (err) {
      console.error("Failed to update avatar:", err);
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    setShowAvatarOptions(false);

    try {
      const res = await fetch(`http://localhost:5000/api/profile/avatar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, avatarUrl: data.avatarUrl });
      } else {
        console.error("Avatar upload failed", res.status);
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    }
  };

  const handleMessage = () => {
    // Navigate to DM chat with this profile's user
    navigate(`/dm/chatpage/${profile.id}/${username}`);
  };

  const handleFollow = async () => {
    try {
      const url = isFollowing
        ? `http://localhost:5000/api/profile/unfollow/${profile.id}`
        : `http://localhost:5000/api/profile/follow/${profile.id}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(!isFollowing);
        setFollowersCount(data.targetFollowerCount);
      } else {
        console.error("Follow/unfollow failed", response.status);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  // ✅ Fetch profile + follow status when username or loggedInUsername changes
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/${username}`, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        });

        if (!res.ok) {
          console.error("Error fetching profile:", res.status);
          return;
        }

        const data = await res.json();
        setProfile(data);
        setPosts(data.posts || []);
        setFollowersCount(data.stats?.followers || 0);

        // ✅ Only check follow if logged-in user is viewing someone else's profile
        if (data.id && loggedInUsername && loggedInUsername !== username.toLowerCase()) {
          try {
            const followRes = await fetch(
              `http://localhost:5000/api/profile/is-Following/${data.id}`,
              { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
            );

            if (followRes.ok) {
              const followData = await followRes.json();
              setIsFollowing(followData.isFollowing);
            } else {
              console.error("Follow status check failed", followRes.status);
              setIsFollowing(false);
            }
          } catch (err) {
            console.error("Networking error on follow check:", err);
          }
        }
      } catch (err) {
        console.error("Networking error:", err);
      }
    }

    if (loggedInUsername) fetchProfile();
  }, [username, loggedInUsername]);

  if (!profile) return <div className="loading">Loading profile...</div>;

  const isOwnProfile = loggedInUsername === username?.toLowerCase();

  return (
    <div className="profilePage">
      <img
        src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
        alt="wallpaper"
        className="bg-image"
      />

      <nav className="Navbar">{t('home.navbar')}</nav>
      <div className="main-content">
        <aside className="left-panel">
          <ul className="leftpanel-animated">
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
  <div className="profile-header">
    <div className="profile-image-container">
      <div className="profile-pic-wrapper">
        <img
          src={profile.avatarUrl || "/pfps/pfp1.jpg"}
          alt="Profile"
          className="profile-image"
        />

        {/* + Button outside image (bottom-right corner) */}
        {isOwnProfile && (
          <div
            className="add-avatar-btn"
            onClick={() => setShowAvatarOptions(!showAvatarOptions)}
          >
            +
          </div>
        )}
      </div>

      {/* Avatar Options Popup */}
      {isOwnProfile && showAvatarOptions && (
        <div className="avatar-options">
          <h4>Choose an Avatar</h4>
          <div className="preset-avatars">
            {presetAvatars.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="avatar"
                className="avatar-option"
                onClick={() => handleSelectAvatar(url)}
              />
            ))}
          </div>
        </div>
      )}
    </div>

    <div className="profile-info-box">
      <h2>@{profile.username}</h2>
      <p>{profile.bio}</p>
      <div className="profile-stats-bar">
        <span>Posts : {profile.stats?.postCount || 0}</span>
        <span>Followers : {followersCount}</span>
        <span>Following : {profile.stats?.following || 0}</span>
      </div>

      {/* ✅ Only show follow/message if not own profile */}
      {!isOwnProfile && (
        <div className="profile-buttons">
          <button className="message-button" onClick={handleMessage}>
            Message
          </button>
          <button
            className={`follow-button ${isFollowing ? "following" : ""}`}
            onClick={handleFollow}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      )}
    </div>
  </div>

  {/* User Posts */}
  <div className="user-posts">
    <h3>{t("profile.myPosts")}</h3>
    <div className="post-grid">
      {posts.map((post) => (
        <div className="grid-post" key={post.id}>
          <div className="grid-post-content">
            <p>{post.content}</p>
            <span className="timestamp">{post.time}</span>
          </div>
        </div>
      ))}
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
    </div>
  );
}

export default Profile;
