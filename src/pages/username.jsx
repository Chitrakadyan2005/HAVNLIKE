import React, { useState } from "react";
import { useRef } from "react";
import "../cssfiles/Username.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_URL from "../utils/api";

function Username() {
  const navigate = useNavigate();
  const otpRefs = useRef([]);
  const [username, setUsername] = useState("");
  const [isReturningUser, setIsReturningUser] = useState(true);
  const [secretPhrase, setSecretPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState("input");
  const [verifyPurpose, setVerifyPurpose] = useState("");
  const [hasVerifiedRegisterEmail, setHasVerifiedRegisterEmail] =
    useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const { t } = useTranslation();

  const sendOtp = async () => {
    try {
      const body =
        verifyPurpose === "register"
          ? { email, purpose: "register" }
          : { username, purpose: "forgot" };

      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOtpIdentifier(verifyPurpose === "register" ? email : username);

      Swal.fire("OTP Sent", "Check your email", "success");
      setVerifyStep("otp");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const verifyOtp = async () => {
    try {
      const enteredOtp = otp.join("");
      if (enteredOtp.length !== 5) {
        Swal.fire("Error", "Enter full OTP", "error");
        return;
      }

      const body =
        verifyPurpose === "register"
          ? { email: otpIdentifier, otp: enteredOtp, purpose: "register" }
          : { username: otpIdentifier, otp: enteredOtp, purpose: "forgot" };

      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowVerifyModal(false);
      setOtp(["", "", "", "", ""]);

      if (verifyPurpose === "register") {
        setHasVerifiedRegisterEmail(true);
        setIsReturningUser(false);
      }

      if (verifyPurpose === "forgot") {
        setIsVerified(true);
        setForgotPasswordMode(true);
      }
    } catch (err) {
      Swal.fire("Verification Failed", err.message, "error");
    }
  };

  const handleSetPassword = async () => {
    if (!username.trim()) {
      Swal.fire({
        title: "Oops 😢",
        text: "Username is required",
        background: "#fff0f6",
        confirmButtonColor: "#d63384",
      });
      return;
    }

    if (!isVerified) {
      Swal.fire("Verify Account", "OTP verification required", "warning");
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      Swal.fire({
        title: "Oops 😢",
        text: "Password must be at least 6 characters",
        background: "#fff0f6",
        confirmButtonColor: "#d63384",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: "Oops 😢",
        text: "Passwords do not match",
        background: "#fff0f6",
        confirmButtonColor: "#d63384",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to reset password");
      }

      Swal.fire({
        title: "Success!",
        text: "Password updated successfully",
        icon: "success",
        background: "#fff0f6",
        confirmButtonColor: "#d63384",
      });

      setForgotPasswordMode(false);
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message,
        icon: "error",
        background: "#fff0f6",
        confirmButtonColor: "#d63384",
      });
    }
  };

  const handleUsername = async () => {
    // 🔐 LOGIN FLOW
    if (isReturningUser) {
      if (!username.trim() || !secretPhrase.trim()) {
        Swal.fire("Error", "Enter username and secret phrase", "error");
        return;
      }
    }

    // 🆕 REGISTER FLOW
    if (!isReturningUser) {
      if (!hasVerifiedRegisterEmail) {
        Swal.fire("Verify Email", "Please verify your email first", "warning");
        return;
      }

      if (!username.trim()) {
        Swal.fire("Error", "Username is required", "error");
        return;
      }

      if (!secretPhrase || secretPhrase.length < 6) {
        Swal.fire(
          "Error",
          "Secret phrase must be at least 6 characters",
          "error",
        );
        return;
      }
    }

    try {
      const endpoint = isReturningUser
        ? "/api/auth/login"
        : "/api/auth/register";

      const body = {
        username,
        email,
        secret_phrase: secretPhrase,
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("username", data.username);

      const { refreshSocketAuth } = await import("../socket");
      refreshSocketAuth();

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
          {isReturningUser
            ? t("username.headingReturning")
            : t("username.headingNew")}
        </h2>

        <input
          type="text"
          placeholder={t("username.inputName")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="username-input"
        />

        {!isReturningUser && (
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={
                isReturningUser
                  ? t("username.enterSecret")
                  : t("username.createSecret")
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

        <p
          className="toggle-mode"
          onClick={() => {
            setIsReturningUser(false);
            setVerifyPurpose("register");
            setVerifyStep("input");
            setShowVerifyModal(true);
          }}
        >
          Create account
        </p>

        <p
          className="forgot-password"
          onClick={() => {
            setVerifyPurpose("forgot");
            setVerifyStep("input");
            setIsVerified(false);
            setOtp(["", "", "", "", ""]);
            setShowVerifyModal(true);
          }}
        >
          Forgot password?
        </p>

        {showVerifyModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowVerifyModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>
                {verifyPurpose === "register"
                  ? "Verify your email"
                  : "Verify your account"}
              </h2>

              {verifyStep === "input" && (
                <>
                  {verifyPurpose === "register" ? (
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="username-input"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="username-input"
                    />
                  )}
                  <button
                    className="modal-btn"
                    onClick={() => {
                      if (
                        (verifyPurpose === "register" && !email.trim()) ||
                        (verifyPurpose === "forgot" && !username.trim())
                      ) {
                        Swal.fire("Error", "Required field missing", "error");
                        return;
                      }
                      sendOtp();
                    }}
                  >
                    Send OTP
                  </button>
                </>
              )}

              {verifyStep === "otp" && (
                <>
                  <p>Enter OTP</p>
                  <div className="otp-container">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/, "");
                          if (!value) return;

                          const newOtp = [...otp];
                          newOtp[i] = value;
                          setOtp(newOtp);

                          // move to next input
                          if (i < otp.length - 1) {
                            otpRefs.current[i + 1].focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            const newOtp = [...otp];

                            if (otp[i]) {
                              newOtp[i] = "";
                              setOtp(newOtp);
                            } else if (i > 0) {
                              otpRefs.current[i - 1].focus();
                              newOtp[i - 1] = "";
                              setOtp(newOtp);
                            }
                          }
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData
                            .getData("text")
                            .replace(/\D/g, "")
                            .slice(0, otp.length);

                          if (pasted.length === otp.length) {
                            setOtp(pasted.split(""));
                            otpRefs.current[otp.length - 1].focus();
                          }
                        }}
                      />
                    ))}
                  </div>

                  <button className="modal-btn" onClick={verifyOtp}>
                    Verify
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {forgotPasswordMode && (
          <div
            className="modal-overlay"
            onClick={() => setForgotPasswordMode(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Set New Secret Phrase</h2>

              {/* Username */}
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="username-input"
              />

              {/* New password */}
              <div className="password-input-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new secret phrase (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="username-input"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Confirm password */}
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new secret phrase"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="username-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <button className="modal-btn" onClick={handleSetPassword}>
                Set Password
              </button>

              <button
                className="modal-btn back-btn"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Username;
