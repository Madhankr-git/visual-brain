import React, { useEffect } from "react";
import { 
  Sparkles, 
  ArrowLeft, 
  BookOpen, 
  Compass, 
  Lightbulb, 
  Network, 
  Layers, 
  Check,
  Sun,
  Moon
} from "lucide-react";
import { ROUTES } from "../../config/routes";

export function WhyVisualBrainPage({ onBackToBrain, onNavigate, theme, toggleTheme }) {
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
            <span className="brand-tag brand-version-tag">PHILOSOPHY</span>
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
                onClick={() => onNavigate(ROUTES.HOW_IT_WORKS)}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                title="See How Visual Brain Works"
              >
                <Compass size={13} />
                <span className="nav-btn-text">How It Works</span>
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

      {/* Main Content Article */}
      <main className="why-article-wrapper">
        <article className="why-article">
          {/* Header Title Section */}
          <div className="why-hero-section">
            <span className="why-badge">Manifesto</span>
            <h1 className="why-main-title">Why Visual Brain?</h1>
            <p className="why-subtitle">Look beyond the image. Understand what makes it.</p>
          </div>

          {/* Intro Section */}
          <section className="why-section">
            <p className="why-lead-text">
              AI has made image creation more accessible than ever. With a few words, anyone can generate something visually impressive. But creating a good image is not just about writing a good prompt. It's about understanding the visual language behind it.
            </p>

            <p className="why-paragraph">
              Lighting, composition, camera perspectives, shadows, textures, colour theory and countless creative decisions work together to shape what we see.
            </p>

            <div className="why-callout-box">
              <span className="why-callout-text">
                Visual Brain exists to make that knowledge accessible.
              </span>
            </div>
          </section>

          {/* Section: Beyond Prompting */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <Lightbulb size={20} color="var(--primary-dark)" />
              Beyond Prompting
            </h2>
            <p className="why-paragraph">
              Most people learn image generation by collecting prompts, copying keywords and experimenting through trial and error.
            </p>
            <p className="why-paragraph">
              But what happens when you understand why a particular keyword works? Why does soft lighting create a different mood? How does an 85mm lens influence the visual perspective? What makes an image feel cinematic, editorial or photojournalistic?
            </p>
            <p className="why-paragraph" style={{ fontWeight: 600, color: "var(--text-main)" }}>
              Understanding these details changes the way we approach image creation.
            </p>
          </section>

          {/* Section: A Library of Visual Knowledge */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <BookOpen size={20} color="var(--primary-dark)" />
              A Library of Visual Knowledge
            </h2>
            <p className="why-paragraph">
              Visual Brain is an evolving collection of AI-generated imagery, carefully documented with the creative techniques, photographic concepts and descriptive vocabulary behind each image.
            </p>
            <p className="why-paragraph">
              Every image becomes an opportunity to learn something new.
            </p>
            <p className="why-paragraph">
              By connecting shared tags, styles, techniques and concepts, individual images become part of a larger network of visual knowledge.
            </p>
          </section>

          {/* Section: Learn. Connect. Create. */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <Network size={20} color="var(--primary-dark)" />
              Learn. Connect. Create.
            </h2>
            <p className="why-paragraph" style={{ marginBottom: "12px" }}>
              The idea is simple:
            </p>

            <div className="why-pillars-grid">
              <div className="why-pillar-card">
                <div className="why-pillar-header">
                  <div className="why-pillar-bullet">1</div>
                  <strong className="why-pillar-title">Learn</strong>
                </div>
                <p className="why-pillar-desc">
                  The vocabulary and techniques used in visual creation.
                </p>
              </div>

              <div className="why-pillar-card">
                <div className="why-pillar-header">
                  <div className="why-pillar-bullet">2</div>
                  <strong className="why-pillar-title">Connect</strong>
                </div>
                <p className="why-pillar-desc">
                  Related concepts through an interconnected visual knowledge network.
                </p>
              </div>

              <div className="why-pillar-card">
                <div className="why-pillar-header">
                  <div className="why-pillar-bullet">3</div>
                  <strong className="why-pillar-title">Create</strong>
                </div>
                <p className="why-pillar-desc">
                  With a deeper understanding of the choices behind every image.
                </p>
              </div>
            </div>
          </section>

          {/* Section: The Bigger Picture */}
          <section className="why-section">
            <h2 className="why-section-heading">
              <Compass size={20} color="var(--primary-dark)" />
              The Bigger Picture
            </h2>
            <p className="why-paragraph">
              Visual Brain isn't about finding the perfect prompt or promising perfect AI-generated images.
            </p>
            <p className="why-paragraph">
              It's about developing an eye for visual quality, understanding the language of imagery and making creative experimentation more meaningful.
            </p>
            <p className="why-paragraph">
              Because the more you understand what makes an image work, the better you become at creating one.
            </p>

            <div className="why-closing-statement">
              Don't just generate images. Understand them.
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
                    onClick={() => onNavigate(ROUTES.HOW_IT_WORKS)}
                  >
                    <Compass size={16} />
                    <span>How Visual Brain Works</span>
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
