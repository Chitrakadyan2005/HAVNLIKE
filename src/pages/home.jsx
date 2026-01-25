import "../cssfiles/Home.css";
import "../cssfiles/layout.css";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { useTranslation } from "react-i18next";
import API_URL from "../utils/api";

function Home() {
  const [posts, setPosts] = useState([]);
  const { t } = useTranslation();

  const username = sessionStorage.getItem("username");
  const token = sessionStorage.getItem("token");

  const [showComments, setShowComments] = useState({});
  const [showPostBox, setShowPostBox] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [commentTexts, setCommentTexts] = useState({});
  const [emojiPickers, setEmojiPickers] = useState({});
  const [openMenu, setOpenMenu] = useState(null); // postId of opened 3-dot menu
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");

  const modalRef = useRef();
  const buttonRef = useRef();

  // ================= FETCH POSTS =================
  useEffect(() => {
    if (!token) return;

    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/home/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${res.status}`,
          );
        }

        const data = await res.json();
        const formattedPosts = data.map((post) => ({
          id: post.id,
          text: post.content,
          user: post.username,
          avatar_url: post.avatar_url || "/default-avatar.png",
          time: new Date(post.created_at).toLocaleString(),
          likesCount: Number(post.likecount || 0),
          comments: post.comments || [],
          commentCount: post.commentcount || 0,
          likedByUser: !!post.likedByUser,
        }));

        setPosts(formattedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
  }, [token]);

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showPostBox &&
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowPostBox(false);
      }

      const emojiContainers = document.querySelectorAll(
        ".emoji-popup, .emoji-picker-container",
      );
      let clickedOutsideEmoji = true;

      emojiContainers.forEach((container) => {
        if (container.contains(e.target)) clickedOutsideEmoji = false;
      });

      const emojiButtons = document.querySelectorAll(
        ".emoji-btn, .bi-emoji-smile",
      );
      emojiButtons.forEach((button) => {
        if (button.contains(e.target)) clickedOutsideEmoji = false;
      });

      if (
        clickedOutsideEmoji &&
        Object.keys(emojiPickers).some((key) => emojiPickers[key])
      ) {
        setEmojiPickers({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPostBox, emojiPickers]);

  // ================= LIKE POST =================
  const handleLike = async (postId) => {
    if (!token) return alert("Please login first.");

    try {
      const res = await fetch(`${API_URL}/api/home/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update post");
      }

      const { liked, likecount } = await res.json();

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByUser: liked === true,
                likesCount: Number(likecount || 0),
              }
            : post,
        ),
      );
    } catch (err) {
      console.error(err.message);
    }
  };

  // ================= ADD POST =================
  const handleAddPost = async () => {
    if (!token) return alert("Please login first.");
    if (!newPostText.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/home/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newPostText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create post");
      }

      const newPost = await res.json();
      const formattedNewPost = {
        id: newPost.id,
        text: newPost.content,
        user: newPost.username,
        avatar_url: newPost.avatar_url || "/default-avatar.png",
        time: new Date(newPost.created_at).toLocaleString(),
        likesCount: Number(newPost.likecount || 0),
        comments: newPost.comments || [],
        commentCount: newPost.commentcount || 0,
        likedByUser: newPost.likedByUser === true,
      };

      setPosts((prev) => [formattedNewPost, ...prev]);
      setNewPostText("");
      setShowPostBox(false);
      setEmojiPickers({});
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditText(post.text);
    setOpenMenu(null);
  };

  const saveEdit = async (postId) => {
    if (!editText.trim() || !token) return;

    try {
      const res = await fetch(`${API_URL}/api/home/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editText }),
      });

      if (!res.ok) throw new Error("Failed to update post");

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, text: editText } : post,
        ),
      );

      setEditingPostId(null);
      setEditText("");
    } catch (err) {
      console.error(err.message);
    }
  };

  const deletePost = async (postId) => {
    if (!token) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/home/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete post");

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setOpenMenu(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  const toggleMenu = (postId) => {
    setOpenMenu((prev) => (prev === postId ? null : postId));
  };

  // ================= ADD COMMENT =================
  const handleAddComment = async (postId) => {
    const text = commentTexts[postId]?.trim();
    if (!text || !token) return;

    try {
      const res = await fetch(`${API_URL}/api/home/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Failed to add comment");
      const newComment = await res.json();

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, newComment],
                commentCount: post.commentCount + 1,
              }
            : post,
        ),
      );

      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      setEmojiPickers((prev) => ({ ...prev, [postId]: false }));
    } catch (err) {
      console.error(err.message);
    }
  };

  // ================= EMOJI =================
  const onEmojiClick = (emojiData, target) => {
    if (target === "post") {
      setNewPostText((prev) => prev + emojiData.emoji);
    } else {
      setCommentTexts((prev) => ({
        ...prev,
        [target]: (prev[target] || "") + emojiData.emoji,
      }));
    }
    setEmojiPickers((prev) => ({ ...prev, [target]: false }));
  };

  const toggleEmoji = (target) => {
    setEmojiPickers((prev) => {
      const newState = {};
      Object.keys(prev).forEach((key) => (newState[key] = false));
      return { ...newState, [target]: !prev[target] };
    });
  };

  const closeEmoji = (target) => {
    setEmojiPickers((prev) => ({ ...prev, [target]: false }));
  };

  // ================= TOGGLE COMMENTS =================
  const toggleComment = (id) => {
    setShowComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
            <Link to="/home">
              <li style={{ "--i": "#a955ff", "--j": "#ea51ff" }}>
                <div className="icon">
                  <i className="bi bi-house"></i>
                </div>
                <span className="title">{t("home.tabs.home")}</span>
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
            <Link to="/room">
              <li style={{ "--i": "#80FF72", "--j": "#7EE8FA" }}>
                <div className="icon">
                  <i className="bi bi-tv"></i>
                </div>
                <span className="title">{t("home.tabs.room")}</span>
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
                <div className="icon">
                  <i className="bi bi-bell"></i>
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
          <div className="feed-container">
            {posts.map((post) => (
              <div className="post" key={post.id}>
                <div className="post-header">
                  <h3>
                    <Link
                      to={`/profile/${post.user}`}
                      className="username-link"
                    >
                      <img
                        src={post.avatar_url}
                        alt={post.user}
                        className="post-avatar"
                      />
                      {post.user}
                    </Link>
                  </h3>

                  <div className="post-header-right">
                    <span className="post-time">{post.time}</span>

                    {/* 3-dot menu */}
                    {/* Show menu ONLY for post owner */}
                    {post.user === username && (
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
                </div>

                <div className="post-body">
                  {editingPostId === post.id ? (
                    <div className="edit-post-box">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && saveEdit(post.id)
                        }
                      />
                      <button onClick={() => saveEdit(post.id)}>Save</button>
                      <button onClick={() => setEditingPostId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p>{post.text}</p>
                  )}
                </div>

                <div className="post-actions">
                  <i
                    className={`bi ${post.likedByUser ? "bi-heart-fill liked" : "bi-heart"}`}
                    onClick={() => handleLike(post.id)}
                  ></i>
                  <span>{post.likesCount}</span>
                  <i
                    className="bi bi-chat-dots"
                    onClick={() => toggleComment(post.id)}
                  ></i>
                  <span>{post.commentCount}</span>
                </div>

                {showComments[post.id] && (
                  <div className="comment-section">
                    <div className="comment-box">
                      <button
                        className="emoji-btn"
                        onClick={() => toggleEmoji(post.id)}
                      >
                        😊
                      </button>
                      {emojiPickers[post.id] && (
                        <div className="emoji-popup">
                          <div className="emoji-popup-header">
                            <span>Choose Emoji</span>
                            <button
                              className="close-emoji-btn"
                              onClick={() => closeEmoji(post.id)}
                            >
                              ✖
                            </button>
                          </div>
                          <EmojiPicker
                            onEmojiClick={(emojiData) =>
                              onEmojiClick(emojiData, post.id)
                            }
                            width="100%"
                            height="280px"
                          />
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder={t("home.post.writeComment")}
                        value={commentTexts[post.id] || ""}
                        onChange={(e) =>
                          setCommentTexts({
                            ...commentTexts,
                            [post.id]: e.target.value,
                          })
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddComment(post.id)
                        }
                      />
                      <i
                        className="bi bi-send send-icon"
                        onClick={() => handleAddComment(post.id)}
                      ></i>
                    </div>

                    {post.comments.length > 0 && (
                      <div className="comment-replies">
                        {post.comments.map((comment, idx) => (
                          <div className="single-comment" key={idx}>
                            ↳ <strong>{comment.user}</strong>: {comment.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Post Modal */}
            {showPostBox && (
              <div className="popup-overlay">
                <div className="popup-post-box" ref={modalRef}>
                  <div className="post-input">
                    <i
                      className="bi bi-emoji-smile"
                      onClick={() => toggleEmoji("post")}
                    ></i>
                    <input
                      type="text"
                      placeholder={t("home.post.placeholder")}
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddPost()}
                    />
                    <i className="bi bi-send-fill" onClick={handleAddPost}></i>
                  </div>
                  {emojiPickers["post"] && (
                    <div className="emoji-picker-container">
                      <div className="emoji-picker-header">
                        <span>Choose Emoji</span>
                        <button
                          className="close-emoji-btn"
                          onClick={() => closeEmoji("post")}
                        >
                          ✖
                        </button>
                      </div>
                      <EmojiPicker
                        onEmojiClick={(emojiData) =>
                          onEmojiClick(emojiData, "post")
                        }
                        width="100%"
                        height="280px"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="add-post-bottom">
              <button
                ref={buttonRef}
                className="add-post-btn"
                onClick={() => setShowPostBox(true)}
              >
                {t("home.post.addFeeling")}
              </button>
            </div>
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

export default Home;
