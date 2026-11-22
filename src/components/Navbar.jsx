import React, { useState } from "react";
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
  Moon
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
    <div className="floating-navbar-container">
      <header className="floating-navbar-inner">
        {/* Brand */}
        <div
          className="brand"
          onClick={() => onNavigate(isAdmin ? ROUTES.ADMIN : ROUTES.HOME)}
          title="Return to Visual Brain Canvas"
        >
          <div className="brand-icon-wrapper">
            <img
              src="/brand-logo.png"
              alt="Visual Brain Logo"
              className="brand-logo-img"
              onError={(e) => {
                e.currentTarget.src = "https://ffduaazilqxyjwcbuqkw.supabase.co/storage/v1/object/public/cms-media/madhankr/madhankr-brand-logo-small.png";
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span className="brand-title">Visual Brain</span>
            <span className={isAdmin ? "admin-mode-tag" : "brand-tag"}>
              {isAdmin ? "ADMIN MODE" : "v1.2"}
            </span>
          </div>
        </div>

        {/* Search Bar with Active Search Button */}
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
            <span>Find</span>
          </button>
        </form>

        {/* Right Navigation & Action Cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          {/* Gallery / Visual Brain Switcher */}
          {currentView === "connections" ? (
            <button
              className="nav-switch-btn"
              onClick={() => onNavigate(isAdmin ? ROUTES.ADMIN_GALLERY : ROUTES.GALLERY)}
              title="Switch to Archive Gallery"
            >
              <Grid size={14} />
              <span>Go to Gallery</span>
            </button>
          ) : (
            <button
              className="nav-switch-btn active-gallery"
              onClick={() => onNavigate(isAdmin ? ROUTES.ADMIN : ROUTES.HOME)}
              title="Return to Visual Brain Canvas"
            >
              <Network size={14} />
              <span>Back to Visual Brain</span>
            </button>
          )}

          {/* ADMIN-ONLY Privileges: Only visible when logged in as admin */}
          {isAdmin && (
            <>
              <button
                className="ghost-btn"
                onClick={onResetData}
                title="Reset to default sample archive (Admin)"
              >
                <RotateCcw size={13} />
                <span>Reset Samples</span>
              </button>

              <button
                className="upload-btn"
                onClick={onOpenUpload}
                title="Upload and document new AI visual (Admin)"
              >
                <Plus size={15} />
                <span>Upload Image</span>
              </button>

              <button
                className="ghost-btn admin-exit-btn"
                onClick={onLogout}
                title="Exit Admin Mode and return to Viewer role"
              >
                <LogOut size={13} />
                <span>Exit Admin</span>
              </button>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
