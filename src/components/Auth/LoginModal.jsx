import React, { useState } from "react";
import { 
  Lock, 
  Mail, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  ShieldCheck 
} from "lucide-react";
import { AuthService } from "../../services/auth";

export function LoginModal({ isOpen, onSuccess, onCancel }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    setTimeout(() => {
      const res = AuthService.login(email, password);
      setIsLoading(false);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || "Authentication failed.");
      }
    }, 250);
  };

  return (
    <div className="modal-overlay" style={{ background: "rgba(15, 23, 42, 0.6)" }}>
      <div 
        className="upload-modal" 
        style={{ maxWidth: "440px", padding: "0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="brand-icon-wrapper">
              <Lock size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.2 }}>
                Admin Authentication
              </h2>
              <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                Restricted to Visual Brain operators
              </span>
            </div>
          </div>

          <button 
            type="button"
            className="ghost-btn"
            style={{ padding: "4px 8px", fontSize: "0.72rem" }}
            onClick={onCancel}
            title="Return to public gallery"
          >
            <ArrowLeft size={13} /> Return
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {errorMessage && (
            <div style={{
              padding: "10px 12px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#e11d48",
              fontSize: "0.78rem",
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
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Mail size={12} /> Administrator Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="mail@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Lock size={12} /> Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ width: "100%", paddingRight: "36px" }}
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
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="submit"
              className="upload-btn"
              disabled={isLoading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "8px 16px",
                fontSize: "0.85rem"
              }}
            >
              <ShieldCheck size={16} />
              <span>{isLoading ? "Verifying..." : "Verify & Access Admin Portal"}</span>
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={onCancel}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Cancel & Continue as Viewer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
