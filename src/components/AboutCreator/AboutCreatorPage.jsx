import React, { useEffect } from "react";
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  ExternalLink,
  Globe,
  Compass,
  BookOpen,
  User,
  Layers,
  Palette,
  Sun,
  Moon
} from "lucide-react";
import { ROUTES } from "../../config/routes";

export function AboutCreatorPage({ onBackToBrain, onNavigate, theme, toggleTheme }) {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="why-page-container">
      {/* Top Floating Header */}
      <header className="why-page-header">
        <div className="brand" onClick={onBackToBrain} title="Return to Visual Brain Canvas">
          <div className="brand-icon-wrapper">
            <img
              src="/brand-logo.png"
              alt="Visual Brain Logo"
              className="brand-logo-img"
              onError={(e) => {
                e.currentTarget.src = "/brand-logo.png";
              }}
            />
          </div>
          <div className="brand-text-wrap" style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span className="brand-title">Visual Brain</span>
            <span className="brand-tag brand-version-tag">CREATOR</span>
          </div>
        </div>

        <div className="nav-right-actions" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {toggleTheme && (
            <button
              type="button"
              className="ghost-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              <span className="nav-btn-text">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          )}

          {onNavigate && (
            <>
              <button 
                className="ghost-btn"
                onClick={() => onNavigate(ROUTES.WHY_VISUAL_BRAIN)}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                title="Read the Why Visual Brain Manifesto"
              >
                <BookOpen size={13} />
                <span className="nav-btn-text">Why Visual Brain?</span>
              </button>

              <button 
                className="ghost-btn"
                onClick={() => onNavigate(ROUTES.HOW_IT_WORKS)}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                title="See How Visual Brain Works"
              >
                <Compass size={13} />
                <span className="nav-btn-text">How It Works</span>
              </button>
            </>
          )}

          <button 
            className="nav-switch-btn"
            onClick={onBackToBrain}
            style={{ padding: "6px 14px" }}
            title="Return to Visual Brain Canvas"
          >
            <ArrowLeft size={14} />
            <span className="nav-btn-text">Visual Brain</span>
          </button>
        </div>
      </header>

      {/* Main Content Article */}
      <main className="why-article-wrapper">
        <article className="why-article">
          
          {/* Hero Section */}
          <div className="why-hero-section">
            <span className="why-badge">Creator Profile</span>
            <h1 className="why-main-title">About the Creator</h1>
            <p className="why-subtitle">A designer exploring the space between creativity and technology.</p>
          </div>

          {/* Bio & Perspective Section */}
          <section className="why-section">
            <p className="why-lead-text">
              I'm Madhankumar Rajagopal, a designer interested in visual communication, digital experiences, and the evolving relationship between design and technology.
            </p>

            <p className="why-paragraph">
              My journey across graphic design and UI/UX has made me curious about how visual elements, creative decisions, and emerging AI tools come together to shape what we see.
            </p>

            <p className="why-paragraph">
              I created Visual Brain as an experiment to explore that curiosity to connect visual knowledge, discover creative possibilities, and understand what goes into creating an image beyond the final output.
            </p>

            <div className="why-callout-box">
              <span className="why-callout-text">
                For me, design is not just about making things look good. It's about understanding the thinking behind them.
              </span>
            </div>
          </section>

          {/* Section: Explore More of My Work */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <Globe size={20} color="var(--primary-dark)" />
              Explore More of My Work
            </h2>

            <p className="why-paragraph">
              Visual Brain is just one part of my creative journey. I share more of my work, experiments, and thoughts on design and technology on my personal website.
            </p>

            {/* Architectural Link Card to Personal Website */}
            <div className="creator-card">
              <div className="creator-card-content">
                <div className="creator-card-header">
                  <div className="creator-avatar-wrap">
                    <User size={22} color="var(--primary-dark)" />
                  </div>
                  <div>
                    <h3 className="creator-name">Madhankumar Rajagopal</h3>
                    <span className="creator-role">Designer & Creative Technologist</span>
                  </div>
                </div>

                <p className="why-paragraph" style={{ margin: "4px 0 12px 0", fontSize: "0.88rem" }}>
                  Portfolio, case studies, visual design explorations, and writings on design systems and technology.
                </p>

                <a 
                  href="https://madhankr.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="creator-website-link"
                >
                  <span style={{ fontWeight: 700 }}>Visit my website →</span>
                  <span className="creator-url">https://madhankr.com</span>
                  <ExternalLink size={15} style={{ marginLeft: "auto" }} />
                </a>
              </div>
            </div>

            {/* Bottom Actions Cluster */}
            <div style={{ marginTop: "28px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <button 
                className="upload-btn"
                style={{ padding: "10px 22px", fontSize: "0.9rem" }}
                onClick={onBackToBrain}
              >
                <Sparkles size={16} />
                <span>Explore the Visual Brain Network</span>
              </button>

              {onNavigate && (
                <>
                  <button 
                    className="ghost-btn"
                    style={{ padding: "10px 20px", fontSize: "0.9rem", background: "var(--bg-secondary)" }}
                    onClick={() => onNavigate(ROUTES.HOW_IT_WORKS)}
                  >
                    <Compass size={16} />
                    <span>How Visual Brain Works</span>
                  </button>

                  <button 
                    className="ghost-btn"
                    style={{ padding: "10px 20px", fontSize: "0.9rem", background: "var(--bg-secondary)" }}
                    onClick={() => onNavigate(ROUTES.WHY_VISUAL_BRAIN)}
                  >
                    <BookOpen size={16} />
                    <span>Why Visual Brain?</span>
                  </button>
                </>
              )}
            </div>
          </section>

        </article>
      </main>
    </div>
  );
}
