import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import API_URL from "../utils/api";

function SetupUsername() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      const providerId = user.providerData[0]?.providerId;
      if (providerId === "google.com") {
        setIsGoogleUser(true);
      }
    }
  }, []);

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      Swal.fire("Error", "Username is required", "error");
      return;
    }

    if (isGoogleUser && !password.trim()) {
      Swal.fire("Error", "Please set a password", "error");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        Swal.fire("Session expired", "Please login again", "warning");
        navigate("/login");
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(`${API_URL}/api/auth/setup-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password: isGoogleUser ? password : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      Swal.fire("Welcome 🎉", "Username set successfully", "success");
      sessionStorage.setItem("username", data.username);
      navigate(`/profile/${data.username}`);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
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
          {isGoogleUser ? "Set username & password" : "Choose your username"}
        </h2>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="username-input"
        />
        {isGoogleUser && (
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Set password for your account"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="username-input"
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        )}

        <button className="username-btn" onClick={handleSaveUsername}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default SetupUsername;
