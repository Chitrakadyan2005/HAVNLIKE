import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../cssfiles/profile.css";
import "../cssfiles/layout.css";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import API_URL from "../utils/api";

function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { t } = useTranslation();

  const [myProfile, setMyProfile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loggedInUsername, setLoggedInUsername] = useState(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");

  const presetAvatars = [
    "/pfps/default.png",
    "/pfps/pfp1.jpg",
    "/pfps/pfp2.jpg",
    "/pfps/pfp3.jpg",
    "/pfps/pfp4.jpg",
    "/pfps/pfp5.jpg",
    "/pfps/pfp6.jpg",
    "/pfps/pfp7.jpg",
    "/pfps/pfp8.jpg",
    "/pfps/pfp9.jpg",
    "/pfps/pfp10.jpg",
  ];

  // ✅ Return proper avatar (default only if not chosen)
  const getAvatar = (url) => {
    if (!url || url === "null" || url.trim() === "") {
      return "/pfps/default.png";
    }
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return url;
    return `/pfps/${url}`;
  };

  // ✅ Logged-in username
  useEffect(() => {
    const sessionUsername = sessionStorage.getItem("username");
    if (sessionUsername) {
      setLoggedInUsername(sessionUsername.toLowerCase());
    } else {
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

  // ✅ Fetch logged-in user's own profile (so it doesn't change)
  useEffect(() => {
    async function fetchMyProfile() {
      try {
        const res = await fetch(`${API_URL}/api/profile/${loggedInUsername}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setMyProfile(data);
        }
      } catch (err) {
        console.error("Error loading my profile:", err);
      }
    }
    if (loggedInUsername) fetchMyProfile();
  }, [loggedInUsername]);

  // ✅ Fetch target profile (your own or others)
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/api/profile/${username}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setProfile(data);
        setPosts(data.posts || []);
        setFollowersCount(data.stats?.followers || 0);

        if (loggedInUsername && loggedInUsername !== username.toLowerCase()) {
          const followRes = await fetch(
            `${API_URL}/api/profile/is-Following/${data.id}`,
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            },
          );
          if (followRes.ok) {
            const followData = await followRes.json();
            setIsFollowing(followData.isFollowing);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }
    if (loggedInUsername) fetchProfile();
  }, [username, loggedInUsername]);

  // ✅ Avatar choose (affects only your own profile)
  const handleSelectAvatar = async (url) => {
    setMyProfile({ ...myProfile, avatarUrl: url });
    setShowAvatarOptions(false);
    try {
      await fetch(`${API_URL}/api/profile/avatar`, {
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

  // ✅ Avatar upload (only affects your profile)
  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setShowAvatarOptions(false);
    try {
      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMyProfile({ ...myProfile, avatarUrl: data.avatarUrl });
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    }
  };

  const handleMessage = () => {
    navigate(`/dm/chatpage/${profile.id}/${username}`);
  };
  const toggleMenu = (postId) => {
    setOpenMenu((prev) => (prev === postId ? null : postId));
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditText(post.content);
    setOpenMenu(null);
  };

  const saveEdit = async (postId) => {
    if (!editText.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/home/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ content: editText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update post");
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, content: editText } : p)),
      );

      setEditingPostId(null);
      setEditText("");
    } catch (err) {
      alert(err.message);
    }
  };

  const deletePost = async (postId) => {
    const confirmDelete = window.confirm("Delete this post?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/home/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete post");
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setOpenMenu(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFollow = async () => {
    try {
      const url = isFollowing
        ? `${API_URL}/api/profile/unfollow/${profile.id}`
        : `${API_URL}/api/profile/follow/${profile.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(!isFollowing);
        setFollowersCount(data.targetFollowerCount);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  const fetchFollowers = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/profile/followers/${profile.id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setFollowersList(data.followers || []);
      }
    } catch (err) {
      console.error("Error fetching followers:", err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/profile/following/${profile.id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setFollowingList(data.following || []);
      }
    } catch (err) {
      console.error("Error fetching following:", err);
    }
  };

  const isOwnProfile = loggedInUsername === username?.toLowerCase();
  const currentProfile = isOwnProfile ? myProfile : profile;

  return (
    <div className="profilePage">
      <img
        src="https://i.pinimg.com/736x/64/5f/40/645f4034ce36c03a18e0211b0f6728c4.jpg"
        alt="wallpaper"
        className="bg-image"
      />

      <nav className="Navbar">{t("home.navbar")}</nav>
      <div className="main-content">
        <aside className="left-panel">
          <ul className="leftpanel-animated">
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
            <Link
              to={`/profile/${loggedInUsername}`}
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
          <div className="profile-header">
            <div className="profile-image-container">
              <div className="profile-pic-wrapper">
                <img
                  src={getAvatar(currentProfile?.avatarUrl)}
                  alt="Profile"
                  className="profile-image"
                  onError={(e) => (e.target.src = "/pfps/default.png")}
                />
                {isOwnProfile && (
                  <div
                    className="add-avatar-btn"
                    onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                  >
                    +
                  </div>
                )}
              </div>

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
                  <div className="upload-avatar">
                    <label htmlFor="avatarUpload" className="upload-btn">
                      Upload Avatar
                    </label>
                    <input
                      type="file"
                      id="avatarUpload"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleUploadAvatar}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="profile-info-box">
              <h2>@{currentProfile?.username || username}</h2>
              <div className="profile-stats-bar">
                <div
                  className={`stat-item ${activeTab === "posts" ? "active" : ""}`}
                  onClick={() => setActiveTab("posts")}
                >
                  Posts : {currentProfile?.stats?.postCount || 0}
                </div>
                <div
                  className={`stat-item ${activeTab === "followers" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("followers");
                    fetchFollowers();
                  }}
                >
                  Followers : {followersCount}
                </div>
                <div
                  className={`stat-item ${activeTab === "following" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("following");
                    fetchFollowing();
                  }}
                >
                  Following : {currentProfile?.stats?.following || 0}
                </div>
              </div>

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

          <div className="user-posts">
            <h3>
              {activeTab === "posts"
                ? "My Posts"
                : activeTab === "followers"
                  ? "Followers"
                  : "Following"}
            </h3>

            {activeTab === "posts" && (
              <div className="post-grid">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div className="grid-post" key={post.id}>
                      <div className="grid-post-header">
                        {isOwnProfile && (
                          <div className="post-menu">
                            <i
                              className="bi bi-three-dots"
                              onClick={() => toggleMenu(post.id)}
                            ></i>

                            {openMenu === post.id && (
                              <div className="post-menu-dropdown">
                                <div
                                  className="menu-item"
                                  onClick={() => startEdit(post)}
                                >
                                  Edit <i className="bi bi-pencil"></i>
                                </div>
                                <div
                                  className="menu-item delete"
                                  onClick={() => deletePost(post.id)}
                                >
                                  Delete <i className="bi bi-trash"></i>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid-post-content">
                        {editingPostId === post.id ? (
                          <div className="edit-post-box">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                            />
                            <div className="edit-post-actions">
                              <button
                                className="save"
                                onClick={() => saveEdit(post.id)}
                              >
                                Save
                              </button>
                              <button
                                className="cancel"
                                onClick={() => setEditingPostId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p>{post.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No posts yet.</p>
                )}
              </div>
            )}

            {activeTab === "followers" && (
              <div className="followers-list">
                {followersList.map((user) => (
                  <div className="follower-item" key={user.id}>
                    <img
                      src={getAvatar(user.avatarUrl)}
                      alt={user.username}
                      className="follower-avatar"
                      onError={(e) => (e.target.src = "/pfps/default.png")}
                    />
                    <span>{user.username}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "following" && (
              <div className="following-list">
                {followingList.map((user) => (
                  <div className="follower-item" key={user.id}>
                    <img
                      src={getAvatar(user.avatarUrl)}
                      alt={user.username}
                      className="follower-avatar"
                      onError={(e) => (e.target.src = "/pfps/default.png")}
                    />
                    <span>{user.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="right-panel">
          <p className="welcome-text">{t("home.greeting")}</p>
          <div className="reach-out">
            <span>{t("home.reachOut")}</span>
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
