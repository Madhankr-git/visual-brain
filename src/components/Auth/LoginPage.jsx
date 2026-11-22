import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Mail, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon
} from "lucide-react";
import { AuthService } from "../../services/auth";
import { ROUTES, navigateTo } from "../../config/routes";

export function LoginPage({ onLoginSuccess, onBackToHome, theme, toggleTheme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect straight to /admin
  useEffect(() => {
    let mounted = true;
    async function checkExistingAuth() {
      const isAuthed = await AuthService.isAuthenticated();
      if (mounted && isAuthed) {
        navigateTo(ROUTES.ADMIN);
        if (onLoginSuccess) onLoginSuccess();
      }
    }
    checkExistingAuth();
    return () => { mounted = false; };
  }, [onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await AuthService.login(email, password);
      setIsLoading(false);
      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        } else {
          navigateTo(ROUTES.ADMIN);
        }
      } else {
        setErrorMessage(res.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="login-page-container">
      {/* Background Technical Grid */}
      <div className="login-grid-background" />

      {/* Main Login Card */}
      <div className="login-card">
        {/* Brand Banner */}
        <div className="login-card-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="brand-icon-wrapper" style={{ width: "36px", height: "36px" }}>
                <img
                  src="/brand-logo.png"
                  alt="Visual Brain Logo"
                  className="brand-logo-img"
                  onError={(e) => {
                    e.currentTarget.src = "https://ffduaazilqxyjwcbuqkw.supabase.co/storage/v1/object/public/cms-media/madhankr/madhankr-brand-logo-small.png";
                  }}
                />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="brand-title" style={{ fontSize: "1.15rem" }}>Visual Brain</span>
                  <span className="admin-mode-tag">ADMIN PORTAL</span>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
                  AI Image & Photographic Technique Archive
                </p>
              </div>
            </div>

            {toggleTheme && (
              <button
                type="button"
                className="ghost-btn theme-toggle-btn"
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                style={{ padding: "4px 8px" }}
              >
                {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="login-card-body">
          <div style={{ marginBottom: "4px" }}>
            <h1 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "2px" }}>
              Administrator Sign In
            </h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
              Access restricted to library operators and technique curators.
            </p>
          </div>

          {errorMessage && (
            <div style={{
              padding: "10px 12px",
              background: "var(--accent-rose-bg)",
              border: "1px solid var(--accent-rose-border)",
              color: "var(--accent-rose)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={13} color="var(--primary-dark)" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              className="form-input"
              style={{ height: "38px", fontSize: "0.85rem" }}
              placeholder="mail@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={13} color="var(--primary-dark)" />
              <span>Password</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ width: "100%", height: "38px", paddingRight: "38px", fontSize: "0.85rem" }}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="submit"
              className="upload-btn"
              disabled={isLoading}
              style={{
                width: "100%",
                justifyContent: "center",
                height: "40px",
                fontSize: "0.85rem",
                cursor: isLoading ? "wait" : "pointer"
              }}
            >
              <ShieldCheck size={16} />
              <span>{isLoading ? "Authenticating..." : "Sign In to Admin Portal"}</span>
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={onBackToHome}
              style={{
                width: "100%",
                justifyContent: "center",
                height: "36px",
                fontSize: "0.8rem",
                color: "var(--text-muted)"
              }}
            >
              <ArrowLeft size={14} />
              <span>Return to Visual Brain (Viewer Mode)</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div style={{
          padding: "12px 24px",
          background: "var(--bg-tertiary)",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "0.7rem",
          color: "var(--text-dim)",
          textAlign: "center"
        }}>
          Visual Brain v0.1 • Protected Administrator Gateway
        </div>
      </div>
    </div>
  );
}
