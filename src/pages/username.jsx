import API_URL from "../utils/api";
import React, { useState } from "react";
import { useRef } from "react";
import "../cssfiles/Username.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

function Username() {
  const navigate = useNavigate();
  const [isReturningUser, setIsReturningUser] = useState(true);
  const [secretPhrase, setSecretPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const { t } = useTranslation();

  const handleUsername = async () => {
    try {
      if (!email.trim() || !secretPhrase.trim()) {
        Swal.fire("Error", "Email and password required", "error");
        return;
      }

      let userCredential;

      if (!isReturningUser) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          secretPhrase,
        );

        await sendEmailVerification(userCredential.user);

        Swal.fire(
          "Verify your email 📧",
          "We’ve sent you a verification link. Please verify before logging in.",
          "info",
        );

        return;
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          secretPhrase,
        );

        if (!userCredential.user.emailVerified) {
          Swal.fire(
            "Email not verified",
            "Please verify your email before logging in.",
            "warning",
          );
          return;
        }
      }

      const token = await userCredential.user.getIdToken(true);

      const res = await fetch(`${API_URL}/api/auth/firebase-login`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Backend sync failed");

      sessionStorage.setItem("token", token);
      const data = await res.json();
      sessionStorage.setItem("username", data.user.username);

      if (!data.user.username) {
        navigate("/setup-username");
      } else {
        navigate(`/profile/${data.user.username || "me"}`);
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Swal.fire("Error", "Enter your email first", "error");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire("Success", "Password reset email sent 📧", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const token = await user.getIdToken(true);

      const res = await fetch(`${API_URL}/api/auth/firebase-login`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Backend sync failed");

      const data = await res.json();

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("username", data.user.username);

      if (!data.user.username) {
        navigate("/setup-username");
      } else {
        navigate(`/profile/${data.user.username}`);
      }
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
          {isReturningUser
            ? "Login to your account"
            : "Create account (email verification required)"}
        </h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="username-input"
        />

        {!isReturningUser && (
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={
                isReturningUser ? "Enter password" : "Create password"
              }
              value={secretPhrase}
              onChange={(e) => setSecretPhrase(e.target.value)}
              className="username-input"
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        )}

        {isReturningUser && (
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("username.enterSecret")}
              value={secretPhrase}
              onChange={(e) => setSecretPhrase(e.target.value)}
              className="username-input"
              minLength={5}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        )}

        <button className="username-btn" onClick={handleUsername}>
          {isReturningUser ? "Login" : "Register"}
        </button>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            width="18"
            height="18"
          />
          Continue with Google
        </button>

        <p
          className="toggle-mode"
          onClick={() => {
            setIsReturningUser(false);
          }}
        >
          Create account
        </p>

        <p className="forgot-password" onClick={handleForgotPassword}>
          Forgot password?
        </p>
      </div>
    </div>
  );
}

export default Username;
