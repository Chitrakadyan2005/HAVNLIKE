import { useParams, Link } from "react-router-dom";
import "../cssfiles/joinedcommunity.css";
import "../cssfiles/layout.css";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import API_URL from "../utils/api";
import EmojiPicker from "emoji-picker-react";
import { getFreshToken } from "../utils/getToken";
import { checkModeration } from "../utils/moderateText";

function JoinedCommunity() {
  const [posts, setPosts] = useState([]);
  const { t } = useTranslation();
  const { communityId } = useParams();

  const username = sessionStorage.getItem("username");

  const [showComments, setShowComments] = useState({});
  const [showPostBox, setShowPostBox] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [commentTexts, setCommentTexts] = useState({});
  const [emojiPickers, setEmojiPickers] = useState({});
  const [openMenu, setOpenMenu] = useState(null); // postId of opened 3-dot menu
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");
  const isNoFilterCommunity = communityId === "no-filter";
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const modalRef = useRef();
  const buttonRef = useRef();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUnread = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/notification/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setHasUnread(data.hasUnread);
      } catch (err) {
        console.error("Unread check failed", err);
      }
    };

    checkUnread();
  }, []);

  // ================= FETCH POSTS =================
  useEffect(() => {
    const fetchPosts = async () => {
      const token = await getFreshToken();

      if (!token) {
        console.log("Token not ready, retrying...");
        setTimeout(fetchPosts, 800);
        return;
      }
      try {
        setLoading(true);

        const res = await fetch(
          `${API_URL}/api/community/${communityId}/posts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          console.log("Backend error:", data);
          setPosts([]);
          return;
        }

        setPosts(
          (data || []).map((post) => ({
            ...post,
            user: post.username,
            text: post.content,
            time: new Date(post.created_at).toLocaleString(),
            likesCount: Number(post.likecount || 0),
            commentCount: Number(post.commentcount || 0),
            comments: post.comments || [],
          })),
        );
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [communityId, refreshTrigger]);

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
    const token = await getFreshToken();
    if (!token) return alert("Please login first.");

    try {
      const res = await fetch(
        `${API_URL}/api/community/${communityId}/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

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

  const handleAddPost = async () => {
    if (!newPostText.trim()) return;

    const token = await getFreshToken();
    if (!token) return;

    const text = newPostText.trim();

    if (!isNoFilterCommunity) {
      const moderation = await checkModeration(text, token);

      if (!moderation.allowed) {
        if (moderation.action === "suspended") {
          alert("🚫 Your account has been temporarily suspended.");
        } else if (moderation.action === "warning") {
          alert(
            `⚠️ Warning ${moderation.warningsUsed}/${moderation.warningsUsed + moderation.warningsLeft}`,
          );
        } else {
          alert("🚫 This post violates rules.");
        }
        return;
      }

      if (moderation.severity === 1) {
        alert("⚠️ Be respectful");
        return;
      }
    }

    setNewPostText("");

    try {
      const res = await fetch(`${API_URL}/api/community/${communityId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      const newPost = await res.json();

      setPosts((prev) => [
        {
          ...newPost,
          user: newPost.username,
          text: newPost.content,
          time: new Date(newPost.created_at).toLocaleString(),
          likesCount: 0,
          commentCount: 0,
          comments: [],
        },
        ...prev,
      ]);

      setShowPostBox(false);

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditText(post.text || post.content);
    setOpenMenu(null);
  };

  const saveEdit = async (postId) => {
    const token = await getFreshToken();
    if (!editText.trim() || !token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/community/${communityId}/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: editText }),
        },
      );

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
    const token = await getFreshToken();
    if (!token) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${API_URL}/api/community/${communityId}/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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

  const handleAddComment = async (postId) => {
    const token = await getFreshToken();
    if (!token) return alert("Please login again.");

    const text = commentTexts[postId]?.trim();
    if (!text) return;

    if (!isNoFilterCommunity) {
      const moderation = await checkModeration(text, token);

      if (!moderation.allowed) {
        if (moderation.action === "suspended") {
          alert("🚫 Your account has been temporarily suspended.");
        } else if (moderation.action === "warning") {
          alert(
            `⚠️ Warning ${moderation.warningsUsed}/${moderation.warningsUsed + moderation.warningsLeft}`,
          );
        } else {
          alert("🚫 This comment violates rules.");
        }
        return;
      }
    }

    try {
      const res = await fetch(
        `${API_URL}/api/community/${communityId}/posts/${postId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        },
      );

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
    <div className="commynitypage">
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
            <Link to="/room">
              <li style={{ "--i": "#80FF72", "--j": "#7EE8FA" }}>
                <div className="icon">
                  <i className="bi bi-tv"></i>
                </div>
                <span className="title">{t("home.tabs.room")}</span>
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
            <Link to="/community" style={{ textDecoration: "none" }}>
              <li style={{ "--i": "#ff9ad5", "--j": "#ffd1ea" }}>
                <div className="icon">
                  <i className="bi bi-people"></i>
                </div>
                <span className="title">Community</span>
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
                <div className="notification-icon-wrapper">
                  <i className="bi bi-bell"></i>
                  {hasUnread && <span className="notif-dot"></span>}
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
          <div className="community-header">
            <h2>#{communityId.replace("-", " ")}</h2>

            <Link
              to={`/room/community-${communityId}`}
              state={{ from: `/community/${communityId}` }}
            >
              <button className="live-chat-btn">💬 Live Chat</button>
            </Link>
          </div>
          <div className="feed-container">
            {loading ? (
              <p style={{ textAlign: "center" }}>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999" }}>
                No posts yet. Be the first one 💗
              </p>
            ) : (
              posts.map((post) => (
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEdit(post.id);
                            }
                          }}
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
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
                              ↳ <strong>{comment.username}</strong>:{" "}
                              {comment.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPost();
                        }
                      }}
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
              href="https://www.instagram.com/havnlike.space?igsh=ODJ1MnQ0MmVweWdx"
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
        <Link to="/room" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#80FF72", "--j": "#7EE8FA" }}>
            <div className="icon">
              <i className="bi bi-tv"></i>
            </div>
          </li>
        </Link>
        <Link to="/search" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#56CCF2", "--j": "#2F80ED" }}>
            <div className="icon">
              <i className="bi bi-search"></i>
            </div>
          </li>
        </Link>
        <Link to="/community" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#ff9ad5", "--j": "#ffd1ea" }}>
            <div className="icon">
              <i className="bi bi-people"></i>
            </div>
          </li>
        </Link>
        <Link to="/dm" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#ffa9c6", "--j": "#f434e2" }}>
            <div className="icon">
              <i className="bi bi-chat-dots"></i>
            </div>
          </li>
        </Link>
        <Link to="/notification" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#f6d365", "--j": "#fda085" }}>
            <div className="notification-icon-wrapper">
              <i className="bi bi-bell"></i>
              {hasUnread && <span className="notif-dot"></span>}
            </div>
          </li>
        </Link>
        <Link to="/settings" style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#84fab0", "--j": "#8fd3f4" }}>
            <div className="icon">
              <i className="bi bi-gear"></i>
            </div>
          </li>
        </Link>
        <Link to={`/profile/${username}`} style={{ textDecoration: "none" }}>
          <li style={{ "--i": "#c471f5", "--j": "#fa71cd" }}>
            <div className="icon">
              <i className="bi bi-person"></i>
            </div>
          </li>
        </Link>
      </nav>
    </div>
  );
}

export default JoinedCommunity;
