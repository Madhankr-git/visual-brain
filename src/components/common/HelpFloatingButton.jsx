import React, { useState } from "react";
import { HelpCircle, ArrowUpRight, BookOpen, Compass, Sparkles } from "lucide-react";
import { ROUTES } from "../../config/routes";

export function HelpFloatingButton({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectOption = (route) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <div 
      className="floating-help-wrapper"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Expanded Hover Card / Tooltip Menu */}
      {isOpen && (
        <div className="help-hover-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
            <span className="brand-tag" style={{ fontSize: "0.62rem", padding: "1px 6px" }}>DOCUMENTATION</span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>INFO</span>
          </div>

          {/* Option 1: Why Visual Brain */}
          <div 
            className="help-menu-item"
            onClick={() => handleSelectOption(ROUTES.WHY_VISUAL_BRAIN)}
            title="Read the Why Visual Brain Manifesto"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <BookOpen size={12} color="var(--primary-dark)" />
              <strong style={{ fontSize: "0.82rem", color: "var(--text-main)" }}>
                Why Visual Brain?
              </strong>
              <ArrowUpRight size={11} color="var(--primary-dark)" style={{ marginLeft: "auto" }} />
            </div>
            <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Look beyond the image. Understand what makes it.
            </span>
          </div>

          {/* Option 2: How It Works */}
          <div 
            className="help-menu-item"
            onClick={() => handleSelectOption(ROUTES.HOW_IT_WORKS)}
            title="Read the How Visual Brain Works guide"
            style={{ marginTop: "6px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <Compass size={12} color="var(--primary-dark)" />
              <strong style={{ fontSize: "0.82rem", color: "var(--text-main)" }}>
                How It Works
              </strong>
              <ArrowUpRight size={11} color="var(--primary-dark)" style={{ marginLeft: "auto" }} />
            </div>
            <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Explore how images, tags & network connect.
            </span>
          </div>

          {/* Option 3: About the Creator */}
          <div 
            className="help-menu-item"
            onClick={() => handleSelectOption(ROUTES.ABOUT_CREATOR)}
            title="Learn about Madhankumar Rajagopal"
            style={{ marginTop: "6px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <Sparkles size={12} color="var(--primary-dark)" />
              <strong style={{ fontSize: "0.82rem", color: "var(--text-main)" }}>
                About the Creator
              </strong>
              <ArrowUpRight size={11} color="var(--primary-dark)" style={{ marginLeft: "auto" }} />
            </div>
            <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Madhankumar Rajagopal — Designer profile.
            </span>
          </div>
        </div>
      )}

      {/* Floating Question Mark Trigger Button */}
      <button
        type="button"
        className={`floating-help-btn ${isOpen ? "hovered" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Visual Brain Guide & Philosophy (Click to toggle)"
        aria-label="Visual Brain Guide"
      >
        <span className="help-icon-char">?</span>
        {isOpen && (
          <span className="help-expand-label">Guide & Docs</span>
        )}
      </button>
    </div>
  );
}
