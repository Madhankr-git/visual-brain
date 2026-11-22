import React, { useEffect } from "react";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Camera,
  Sun,
  Maximize2,
  Cpu,
  Tag,
  Network,
  Share2,
  Search,
  Copy,
  Layers,
  Compass,
  CheckCircle2,
  BookOpen,
  Moon
} from "lucide-react";
import { ROUTES } from "../../config/routes";

export function HowItWorksPage({ onBackToBrain, onNavigate, theme, toggleTheme }) {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="why-page-container">
      {/* Top Sticky Header */}
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
            <span className="brand-tag brand-version-tag">HOW IT WORKS</span>
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
                onClick={() => onNavigate(ROUTES.ABOUT_CREATOR)}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                title="About the Creator"
              >
                <Sparkles size={13} />
                <span className="nav-btn-text">About Creator</span>
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

      {/* Main Article Content */}
      <main className="why-article-wrapper">
        <article className="why-article">

          {/* Hero Section */}
          <div className="why-hero-section">
            <span className="why-badge">System Guide</span>
            <h1 className="why-main-title">How Visual Brain Works</h1>
            <p className="why-subtitle">Every image has a story. Every detail creates a connection.</p>
          </div>

          {/* Lead Introduction */}
          <section className="why-section">
            <p className="why-lead-text">
              Visual Brain transforms a collection of AI-generated images into an interconnected visual knowledge network. Instead of simply browsing images, you can explore the creative techniques, photographic attributes and AI vocabulary that shape them.
            </p>
            <p className="why-paragraph">
              Here's how the experience comes together.
            </p>
            <div style={{ height: "1px", background: "var(--border-subtle)", margin: "10px 0" }} />
          </section>

          {/* Section 01 */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <span className="hiw-step-number">01</span>
              Every Image Holds Knowledge
            </h2>
            <p className="why-paragraph">
              An image is more than its final appearance. It represents a combination of creative decisions and technical elements.
            </p>
            <p className="why-paragraph">
              Each image in Visual Brain is documented with information such as:
            </p>

            {/* Structured attributes breakdown */}
            <div className="hiw-attributes-grid">
              <div className="hiw-attr-card">
                <div className="hiw-attr-header">
                  <Camera size={18} color="var(--primary-dark)" />
                  <strong>Photography</strong>
                </div>
                <p className="hiw-attr-desc">Camera, lens and aperture.</p>
              </div>

              <div className="hiw-attr-card">
                <div className="hiw-attr-header">
                  <Sun size={18} color="var(--primary-dark)" />
                  <strong>Lighting</strong>
                </div>
                <p className="hiw-attr-desc">Light sources, direction and shadow characteristics.</p>
              </div>

              <div className="hiw-attr-card">
                <div className="hiw-attr-header">
                  <Maximize2 size={18} color="var(--primary-dark)" />
                  <strong>Composition</strong>
                </div>
                <p className="hiw-attr-desc">Framing, perspective and visual arrangement.</p>
              </div>

              <div className="hiw-attr-card">
                <div className="hiw-attr-header">
                  <Cpu size={18} color="var(--primary-dark)" />
                  <strong>AI Generation</strong>
                </div>
                <p className="hiw-attr-desc">Model and generation prompt.</p>
              </div>

              <div className="hiw-attr-card" style={{ gridColumn: "span 2" }}>
                <div className="hiw-attr-header">
                  <Tag size={18} color="var(--primary-dark)" />
                  <strong>Visual Vocabulary</strong>
                </div>
                <p className="hiw-attr-desc">Descriptive tags and creative keywords.</p>
              </div>
            </div>

            <p className="why-paragraph" style={{ marginTop: "8px" }}>
              This gives every image its own visual breakdown, helping you understand the ideas and techniques behind its appearance.
            </p>
          </section>

          {/* Section 02 */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <span className="hiw-step-number">02</span>
              Tags Create Connections
            </h2>
            <p className="why-paragraph">
              Tags are more than simple labels. They are the foundation of Visual Brain's knowledge network.
            </p>
            <p className="why-paragraph">
              Every image is associated with descriptive keywords that represent its visual characteristics, techniques and creative style.
            </p>

            <div className="why-callout-box">
              <span className="why-callout-text">
                When multiple images share a tag, they become connected through a common concept.
              </span>
            </div>

            <div className="hiw-example-box">
              <span className="hiw-example-label">CONCEPTUAL LINKAGE</span>
              <p className="why-paragraph" style={{ margin: 0, color: "var(--text-main)" }}>
                For example, images tagged with <em>cinematic lighting</em>, <em>volumetric light</em> or <em>shallow depth of field</em> can be explored through their shared visual vocabulary.
              </p>
            </div>

            <p className="why-paragraph">
              As the collection grows, new tags introduce new connections, expanding the network naturally.
            </p>
          </section>

          {/* Section 03 */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <span className="hiw-step-number">03</span>
              Explore the Visual Network
            </h2>
            <p className="why-paragraph">
              This is where individual images become part of something bigger.
            </p>
            <p className="why-paragraph">
              Visual Brain presents images and their shared tags as an interactive network.
            </p>

            <div className="why-pillars-grid">
              <div className="why-pillar-card">
                <div className="why-pillar-header">
                  <div className="why-pillar-bullet" style={{ background: "var(--primary)" }}>
                    <Layers size={13} color="var(--primary-text)" />
                  </div>
                  <strong className="why-pillar-title">Image Nodes</strong>
                </div>
                <p className="why-pillar-desc">
                  Represent individual AI-generated artworks.
                </p>
              </div>

              <div className="why-pillar-card">
                <div className="why-pillar-header">
                  <div className="why-pillar-bullet" style={{ background: "var(--primary-dark)" }}>
                    <Tag size={13} color="#ffffff" />
                  </div>
                  <strong className="why-pillar-title">Tag Nodes</strong>
                </div>
                <p className="why-pillar-desc">
                  Represent shared visual concepts and keywords.
                </p>
              </div>

              <div className="why-pillar-card">
                <div className="why-pillar-header">
                  <div className="why-pillar-bullet" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-strong)" }}>
                    <Share2 size={13} color="var(--text-main)" />
                  </div>
                  <strong className="why-pillar-title">Connections</strong>
                </div>
                <p className="why-pillar-desc">
                  Link images to the tags associated with them.
                </p>
              </div>
            </div>

            <p className="why-paragraph" style={{ marginTop: "8px" }}>
              Explore the canvas, move between connected nodes, zoom into clusters and discover relationships between different visual works.
            </p>

            <div className="why-callout-box" style={{ borderLeftColor: "var(--primary)" }}>
              <span className="why-callout-text" style={{ color: "var(--primary-dark)" }}>
                The network gives you a different way to discover images not just by browsing, but by following ideas.
              </span>
            </div>
          </section>

          {/* Section 04 */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <span className="hiw-step-number">04</span>
              Discover. Inspect. Learn.
            </h2>
            <p className="why-paragraph">
              Every connection opens another opportunity to explore.
            </p>

            <div className="hiw-actions-list">
              <div className="hiw-action-row">
                <div className="hiw-action-bullet">
                  <CheckCircle2 size={16} color="var(--primary-dark)" />
                </div>
                <div className="hiw-action-content">
                  <p className="why-paragraph" style={{ margin: 0, color: "var(--text-main)" }}>
                    Select an image to inspect its photographic details, lighting, composition and AI generation prompt.
                  </p>
                </div>
              </div>

              <div className="hiw-action-row">
                <div className="hiw-action-bullet">
                  <CheckCircle2 size={16} color="var(--primary-dark)" />
                </div>
                <div className="hiw-action-content">
                  <p className="why-paragraph" style={{ margin: 0, color: "var(--text-main)" }}>
                    Select a tag to discover other images associated with that concept.
                  </p>
                </div>
              </div>

              <div className="hiw-action-row">
                <div className="hiw-action-bullet">
                  <CheckCircle2 size={16} color="var(--primary-dark)" />
                </div>
                <div className="hiw-action-content">
                  <p className="why-paragraph" style={{ margin: 0, color: "var(--text-main)" }}>
                    Explore related works, compare their visual characteristics and discover how different techniques contribute to different results.
                  </p>
                </div>
              </div>

              <div className="hiw-action-row">
                <div className="hiw-action-bullet">
                  <CheckCircle2 size={16} color="var(--primary-dark)" />
                </div>
                <div className="hiw-action-content">
                  <p className="why-paragraph" style={{ margin: 0, color: "var(--text-main)" }}>
                    You can also copy the documented generation prompt and use it as a reference for your own creative experiments.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "var(--border-subtle)", margin: "16px 0" }} />
          </section>

          {/* Closing Section: An Expanding Visual Knowledge Network */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <Compass size={20} color="var(--primary-dark)" />
              An Expanding Visual Knowledge Network
            </h2>
            <p className="why-paragraph">
              Visual Brain grows as more images, techniques and vocabulary become part of the collection.
            </p>
            <p className="why-paragraph">
              Each new image introduces new information. Each shared tag creates another connection. Over time, these individual pieces form a growing network of visual knowledge.
            </p>
            <p className="why-paragraph">
              The goal isn't simply to collect beautiful images. It's to understand the creative language behind them.
            </p>

            <div className="why-closing-statement">
              Explore the connections. Understand the details. Create with intention.
            </div>

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
                    onClick={() => onNavigate(ROUTES.WHY_VISUAL_BRAIN)}
                  >
                    <BookOpen size={16} />
                    <span>Read "Why Visual Brain?"</span>
                  </button>

                  <button
                    className="ghost-btn"
                    style={{ padding: "10px 20px", fontSize: "0.9rem", background: "var(--bg-secondary)" }}
                    onClick={() => onNavigate(ROUTES.ABOUT_CREATOR)}
                  >
                    <Sparkles size={16} />
                    <span>About the Creator</span>
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
