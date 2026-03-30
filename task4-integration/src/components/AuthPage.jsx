// AuthPage.jsx — Login / Register screen
//
// Props:
//   onAuthSuccess(token, username) — called after successful login or register
//
// Local state:
//   mode       — "login" | "register"  (toggled by link at bottom)
//   username   — controlled input
//   password   — controlled input
//   loading    — true while API call is in flight
//   error      — error string from API or validation

import { useState } from "react";
import * as api from "../api";
import { WalletIcon, AlertIcon } from "./Icons";

export default function AuthPage({ onAuthSuccess }) {
  const [mode,     setMode]     = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!username.trim()) { setError("Username is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      // Call either login or register based on current mode
      const data = mode === "login"
        ? await api.login(username.trim(), password)
        : await api.register(username.trim(), password);

      // Save the token — api.js will attach it to future requests
      api.setToken(data.token);

      // Bubble up to App so it can switch to the main dashboard
      onAuthSuccess(data.token, username.trim());
    } catch (err) {
      setError(err.message || "Something went wrong. Is your API running?");
    } finally {
      setLoading(false);
    }
  }

  // When switching modes, clear any existing error
  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setUsername("");
    setPassword("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Branding */}
        <div className="auth-logo"><WalletIcon /> FinTrack</div>
        <div className="auth-tagline">Personal Finance Tracker — powered by your Task 3 API</div>

        <div className="auth-title">
          {mode === "login" ? "Sign in to your account" : "Create a new account"}
        </div>

        {/* Error banner */}
        {error && (
          <div className="api-error"><AlertIcon /> {error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g. sarbjeet"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading
              ? (mode === "login" ? "Signing in…" : "Creating account…")
              : (mode === "login" ? "Sign In →" : "Create Account →")
            }
          </button>
        </form>

        {/* Switch mode */}
        <div className="auth-switch">
          {mode === "login" ? (
            <>Don't have an account?<button onClick={() => switchMode("register")}>Register</button></>
          ) : (
            <>Already have an account?<button onClick={() => switchMode("login")}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
