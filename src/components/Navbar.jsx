import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Grid,
  Network,
  Plus,
  RotateCcw,
  Search,
  X,
  LogOut,
  Sun,
  Moon,
  Menu,
  BookOpen,
  Compass
} from "lucide-react";
import { ROUTES } from "../config/routes";

export function Navbar({
  currentView,
  isAdmin,
  onNavigate,
  onOpenUpload,
  onResetData,
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  onLogout,
  theme,
  toggleTheme
}) {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navbarRef = useRef(null);

  // Close mobile burger dropdown on outside click or escape key
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(localSearch);
    if (onSearchSubmit) {
      onSearchSubmit(localSearch);
    }
  };

  const handleClear = () => {
    setLocalSearch("");
    setSearchTerm("");
    if (onSearchSubmit) {
      onSearchSubmit("");
    }
  };

  return (
    <div className="floating-navbar-container" ref={navbarRef}>
      <header className="floating-navbar-inner">
        {/* Brand */}
        <div
          className="brand"
          onClick={() => {
            setIsMenuOpen(false);
            onNavigate(isAdmin ? ROUTES.ADMIN : ROUTES.HOME);
          }}
          title="Return to Visual Brain Canvas"
        >
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
            <span className={isAdmin ? "admin-mode-tag" : "brand-tag brand-version-tag"}>
              {isAdmin ? "ADMIN" : "v1.2"}
            </span>
          </div>
        </div>

        {/* Search Bar with Active Search Button - Always outside burger menu */}
        <form className="search-bar-wrap" onSubmit={handleSubmit}>
          <Search size={14} className="search-icon-left" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search images, prompts, tags..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setSearchTerm(e.target.value);
            }}
          />
          {localSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClear}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
          <button type="submit" className="search-action-btn" title="Navigate to match in Visual Brain">
            <Search size={12} />
            <span className="nav-btn-text">Find</span>
          </button>
        </form>

        {/* Right Navigation & Action Cluster */}
        <div className="nav-right-actions" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Gallery / Back to Visual Brain Switcher - Always outside burger menu */}
          {currentView === "connections" ? (
            <button
              type="button"
              className="nav-switch-btn"
              onClick={() => {
                setIsMenuOpen(false);
                onNavigate(isAdmin ? ROUTES.ADMIN_GALLERY : ROUTES.GALLERY);
              }}
              title="Switch to Archive Gallery"
            >
              <Grid size={14} />
              <span className="nav-btn-text">Gallery</span>
            </button>
          ) : (
            <button
              type="button"
              className="nav-switch-btn active-gallery"
              onClick={() => {
                setIsMenuOpen(false);
                onNavigate(isAdmin ? ROUTES.ADMIN : ROUTES.HOME);
              }}
              title="Return to Visual Brain Canvas"
            >
              <Network size={14} />
              <span className="nav-btn-text">Brain</span>
            </button>
          )}

          {/* Desktop-only Action Buttons */}
          <div className="desktop-nav-actions">
            {/* Light / Dark Mode Theme Switcher */}
            <button
              type="button"
              className="ghost-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun size={14} className="theme-toggle-icon" />
              ) : (
                <Moon size={14} className="theme-toggle-icon" />
              )}
              <span className="nav-btn-text">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            {/* ADMIN-ONLY Privileges */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={onResetData}
                  title="Reset to default sample archive (Admin)"
                >
                  <RotateCcw size={13} />
                  <span className="nav-btn-text">Reset</span>
                </button>

                <button
                  type="button"
                  className="upload-btn"
                  onClick={onOpenUpload}
                  title="Upload and document new AI visual (Admin)"
                >
                  <Plus size={15} />
                  <span className="nav-btn-text">Upload</span>
                </button>

                <button
                  type="button"
                  className="ghost-btn admin-exit-btn"
                  onClick={onLogout}
                  title="Exit Admin Mode and return to Viewer role"
                >
                  <LogOut size={13} />
                  <span className="nav-btn-text">Exit</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className={`mobile-burger-btn ${isMenuOpen ? "active" : ""}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title={isMenuOpen ? "Close menu" : "Open mobile menu"}
            aria-label={isMenuOpen ? "Close menu" : "Open mobile menu"}
          >
            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Mobile Burger Menu Dropdown */}
        {isMenuOpen && (
          <div className="mobile-burger-dropdown">
            <div className="burger-menu-header">
              <span className="burger-menu-tag">MENU & ACTIONS</span>
              <button 
                type="button" 
                className="burger-close-icon"
                onClick={() => setIsMenuOpen(false)}
                title="Close menu"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Theme Switch Row */}
            <div 
              className="burger-theme-row" 
              onClick={() => {
                if (toggleTheme) toggleTheme();
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {theme === "dark" ? <Sun size={14} color="var(--primary)" /> : <Moon size={14} color="var(--primary-dark)" />}
                <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </div>
              <span className="brand-tag" style={{ fontSize: "0.62rem", padding: "1px 6px" }}>
                {theme === "dark" ? "ACTIVE DARK" : "ACTIVE LIGHT"}
              </span>
            </div>

            {/* Admin Controls (if authenticated) */}
            {isAdmin && (
              <div className="burger-section">
                <span className="burger-section-label">ADMIN CONTROLS</span>
                <button
                  type="button"
                  className="upload-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenUpload();
                  }}
                  style={{ width: "100%", justifyContent: "flex-start", padding: "7px 10px" }}
                >
                  <Plus size={14} />
                  <span>Upload Image</span>
                </button>

                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onResetData();
                  }}
                  style={{ width: "100%", justifyContent: "flex-start", padding: "7px 10px" }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Samples</span>
                </button>

                <button
                  type="button"
                  className="ghost-btn admin-exit-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  style={{ width: "100%", justifyContent: "flex-start", padding: "7px 10px" }}
                >
                  <LogOut size={13} />
                  <span>Exit Admin Mode</span>
                </button>
              </div>
            )}

            {/* Documentation & Philosophy Links */}
            <div className="burger-section">
              <span className="burger-section-label">DOCUMENTATION</span>
              
              <div
                className="burger-menu-link"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate(ROUTES.WHY_VISUAL_BRAIN);
                }}
              >
                <BookOpen size={13} color="var(--primary-dark)" />
                <span>Why Visual Brain?</span>
              </div>

              <div
                className="burger-menu-link"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate(ROUTES.HOW_IT_WORKS);
                }}
              >
                <Compass size={13} color="var(--primary-dark)" />
                <span>How It Works</span>
              </div>

              <div
                className="burger-menu-link"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate(ROUTES.ABOUT_CREATOR);
                }}
              >
                <Sparkles size={13} color="var(--primary-dark)" />
                <span>About the Creator</span>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
