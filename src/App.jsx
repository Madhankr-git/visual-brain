import React, { useState, useEffect, useMemo, useCallback } from "react";
import { StorageService } from "./services/storage";
import { AuthService } from "./services/auth";
import { ImageService } from "./services/imageService";
import { Navbar } from "./components/Navbar";
import { GalleryGrid } from "./components/Gallery/GalleryGrid";
import { NetworkGraph } from "./components/VisualConnections/NetworkGraph";
import { UploadModal } from "./components/Upload/UploadModal";
import { ImageDetailPanel } from "./components/ImageView/ImageDetailPanel";
import { LoginPage } from "./components/Auth/LoginPage";
import { WhyVisualBrainPage } from "./components/WhyVisualBrain/WhyVisualBrainPage";
import { HowItWorksPage } from "./components/HowItWorks/HowItWorksPage";
import { AboutCreatorPage } from "./components/AboutCreator/AboutCreatorPage";
import { HelpFloatingButton } from "./components/common/HelpFloatingButton";
import { CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Plus, RotateCcw } from "lucide-react";
import { 
  ROUTES, 
  ROLES, 
  parseRoute, 
  navigateTo 
} from "./config/routes";

export function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Route & Role Management
  const initialRoute = parseRoute(window.location.pathname);
  const [isAuth, setIsAuth] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentView, setCurrentView] = useState(initialRoute.view); // "connections" | "gallery"

  // Theme State: "light" or "dark" (persisted in localStorage with prefers-color-scheme fallback)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("vb_theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("vb_theme", theme);
    } catch (e) {
      console.warn("Could not save theme preference", e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const parsed = parseRoute(currentPath);
  const isWhyPage = parsed.isWhyVisualBrain;
  const isHowItWorksPage = parsed.isHowItWorks;
  const isAboutCreatorPage = parsed.isAboutCreator;
  const isLoginPage = parsed.isLogin || (parsed.role === ROLES.ADMIN && !isAuth);
  const isAdmin = parsed.role === ROLES.ADMIN && isAuth;

  // Selection state for right-side drawer panel
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [galleryTag, setGalleryTag] = useState(null);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // 1. Supabase Auth state subscription and initial verification
  useEffect(() => {
    let mounted = true;

    async function checkInitialAuth() {
      try {
        const authed = await AuthService.isAuthenticated();
        if (mounted) setIsAuth(authed);
      } catch {
        if (mounted) setIsAuth(false);
      }
    }
    checkInitialAuth();

    const { data: authListener } = AuthService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const isAdministrator = await AuthService.isAuthenticated();
        if (mounted) setIsAuth(isAdministrator);
      } else {
        if (mounted) setIsAuth(false);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // 2. Sync route on browser back/forward or navigation
  useEffect(() => {
    const handleLocationChange = async () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const authenticated = await AuthService.isAuthenticated();
      setIsAuth(authenticated);
      const routeInfo = parseRoute(path);
      setCurrentView(routeInfo.view);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Centralized route navigation handler
  const handleNavigate = async (targetPath) => {
    navigateTo(targetPath);
    setCurrentPath(targetPath);
    const authenticated = await AuthService.isAuthenticated();
    setIsAuth(authenticated);
    const routeInfo = parseRoute(targetPath);
    setCurrentView(routeInfo.view);
  };

  // Login success handler
  const handleLoginSuccess = () => {
    setIsAuth(true);
    handleNavigate(ROUTES.ADMIN);
    showToast("Authenticated as Administrator. Welcome!");
  };

  // Logout handler
  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuth(false);
    handleNavigate(ROUTES.HOME);
    showToast("Logged out of Admin Portal");
  };

  // 3. Cloud image loading: Supabase is the single source of truth for production images
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const cloudImages = await ImageService.getImages();
      setImages(cloudImages || []);
    } catch (err) {
      console.error("[Visual Brain] Failed to fetch images from Supabase:", err);
      setLoadError(err.message || "Failed to load visual archive from Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute unique tags across images
  const allTags = useMemo(() => {
    const tagCount = new Map();
    images.forEach((img) => {
      (img.tags || []).forEach((t) => {
        tagCount.set(t, (tagCount.get(t) || 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [images]);

  // Clean up any stale or deleted tags from active filters
  useEffect(() => {
    if (selectedTag && !allTags.includes(selectedTag)) {
      setSelectedTag(null);
    }
    if (galleryTag && !allTags.includes(galleryTag)) {
      setGalleryTag(null);
    }
  }, [allTags, selectedTag, galleryTag]);

  // 4. Protected Admin Handlers: Create & Edit via imageService
  const handleSaveImage = async (imageData, imageFile) => {
    if (!isAdmin) {
      showToast("Access Denied: Administrator authentication required.", "error");
      return;
    }

    try {
      if (editingImage) {
        // Edit mode: only update metadata without re-uploading binary
        const updated = await ImageService.updateImage(editingImage.id, imageData);
        setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
        setSelectedImage(updated);
        setEditingImage(null);
        setIsUploadOpen(false);
        showToast(`Updated "${updated.title}"`);
      } else {
        // Create mode: upload binary to Storage (if provided) and insert to database
        const saved = await ImageService.createImage(imageData, imageFile);
        setImages((prev) => [saved, ...prev]);
        setSelectedImage(saved);
        setSelectedTag(null);
        setIsUploadOpen(false);
        showToast(`Added "${saved.title}" to Visual Brain`);
      }
    } catch (err) {
      console.error("[App:handleSaveImage] Error:", err);
      showToast(err.message || "Failed to save visual record.", "error");
      throw err;
    }
  };

  // 5. Protected Admin Handlers: Delete via imageService
  const handleDeleteImage = async (id) => {
    if (!isAdmin) {
      showToast("Access Denied: Administrator authentication required.", "error");
      return;
    }
    try {
      await ImageService.deleteImage(id);
      // Update graph and gallery state only after confirmed database/storage deletion
      setImages((prev) => prev.filter((i) => i.id !== id));
      setSelectedImage(null);
      showToast("Image removed from Visual Brain archive");
    } catch (err) {
      console.error("[App:handleDeleteImage] Error:", err);
      showToast(err.message || "Failed to delete image", "error");
    }
  };

  const handleOpenEdit = (img) => {
    if (!isAdmin) {
      handleNavigate(ROUTES.LOGIN);
      return;
    }
    setEditingImage(img);
    setIsUploadOpen(true);
  };

  const handleOpenUpload = () => {
    if (!isAdmin) {
      handleNavigate(ROUTES.LOGIN);
      return;
    }
    setEditingImage(null);
    setIsUploadOpen(true);
  };

  // Node selection handlers
  const handleSelectImage = (img) => {
    setSelectedImage(img);
    setSelectedTag(null);
  };

  const handleSelectTag = (tag) => {
    if (currentView === "gallery") {
      setGalleryTag(tag);
      setSelectedImage(null);
      setSelectedTag(null);
      showToast(`Filtering gallery by #${tag}`);
    } else {
      setSelectedTag(tag);
      setSelectedImage(null);
      showToast(`Showing visuals tagged #${tag}`);
    }
  };

  // Search submission from navbar
  const handleSearchSubmit = (query) => {
    setSearchTerm(query);
    setSearchTrigger((prev) => prev + 1);
    if (query && query.trim()) {
      showToast(`Navigating to "${query}" in Visual Brain`);
    }
  };

  // 1. Dedicated Why Visual Brain Manifesto Page (/why-visual-brain)
  if (isWhyPage) {
    return (
      <>
        <WhyVisualBrainPage 
          onBackToBrain={() => handleNavigate(ROUTES.HOME)} 
          onNavigate={handleNavigate}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <HelpFloatingButton onNavigate={handleNavigate} />
        {toast && (
          <div className="toast-container">
            <div className="toast">
              {toast.type === "error" ? (
                <ShieldAlert size={15} color="var(--accent-rose)" />
              ) : (
                <CheckCircle2 size={15} color="var(--primary-dark)" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // 1b. Dedicated How It Works Page (/how-it-works)
  if (isHowItWorksPage) {
    return (
      <>
        <HowItWorksPage 
          onBackToBrain={() => handleNavigate(ROUTES.HOME)} 
          onNavigate={handleNavigate}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <HelpFloatingButton onNavigate={handleNavigate} />
        {toast && (
          <div className="toast-container">
            <div className="toast">
              {toast.type === "error" ? (
                <ShieldAlert size={15} color="var(--accent-rose)" />
              ) : (
                <CheckCircle2 size={15} color="var(--primary-dark)" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // 1c. Dedicated About the Creator Page (/about-creator)
  if (isAboutCreatorPage) {
    return (
      <>
        <AboutCreatorPage 
          onBackToBrain={() => handleNavigate(ROUTES.HOME)} 
          onNavigate={handleNavigate}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <HelpFloatingButton onNavigate={handleNavigate} />
        {toast && (
          <div className="toast-container">
            <div className="toast">
              {toast.type === "error" ? (
                <ShieldAlert size={15} color="var(--accent-rose)" />
              ) : (
                <CheckCircle2 size={15} color="var(--primary-dark)" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // 2. Dedicated Standalone Login Page (/login or unauthenticated /admin)
  if (isLoginPage) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => handleNavigate(ROUTES.HOME)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <HelpFloatingButton onNavigate={handleNavigate} />
        {toast && (
          <div className="toast-container">
            <div className="toast">
              {toast.type === "error" ? (
                <ShieldAlert size={15} color="var(--accent-rose)" />
              ) : (
                <CheckCircle2 size={15} color="var(--primary-dark)" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // 3. Primary Visual Brain Application
  return (
    <div className="app-layout">
      {/* 100% Fullscreen Working Canvas as Primary Visual Brain */}
      {!loading && !loadError && (
        <NetworkGraph
          images={images}
          onSelectImage={handleSelectImage}
          onSelectTag={handleSelectTag}
          highlightImageId={selectedImage?.id}
          highlightTag={selectedTag}
          searchQuery={searchTerm}
          searchTrigger={searchTrigger}
          theme={theme}
        />
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="canvas-status-banner">
          <div className="status-spinner" />
          <span>Connecting to Supabase Visual Brain...</span>
        </div>
      )}

      {/* Error state with retry option */}
      {loadError && (
        <div className="canvas-error-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-rose)", marginBottom: "6px" }}>
            <AlertCircle size={20} />
            <strong style={{ fontSize: "0.95rem" }}>Supabase Connection Error</strong>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "14px", lineHeight: 1.4 }}>
            {loadError}
          </p>
          <button className="upload-btn" onClick={loadData} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
            <RotateCcw size={14} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Empty Cloud Library Banner (Supabase is single source of truth) */}
      {!loading && !loadError && images.length === 0 && (
        <div className="canvas-empty-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-dark)", marginBottom: "6px" }}>
            <Sparkles size={20} />
            <strong style={{ fontSize: "0.95rem" }}>Cloud Visual Brain is Empty</strong>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: isAdmin ? "14px" : "0", lineHeight: 1.4 }}>
            The Cluster currently contains 0 visual records.
            {isAdmin && " As administrator, you can begin documenting new AI visuals and photographic techniques."}
          </p>
          {isAdmin && (
            <button className="upload-btn" onClick={handleOpenUpload} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
              <Plus size={14} />
              <span>Upload First Image</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Header Navbar */}
      <Navbar
        currentView={currentView}
        isAdmin={isAdmin}
        onNavigate={handleNavigate}
        onOpenUpload={handleOpenUpload}
        onResetData={loadData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Floating Gallery Overlay (if toggled) */}
      {currentView === "gallery" && (
        <GalleryGrid
          images={images}
          allTags={allTags}
          selectedTag={galleryTag}
          setSelectedTag={setGalleryTag}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isAdmin={isAdmin}
          onImageClick={(img) => {
            handleSelectImage(img);
          }}
          onOpenUpload={handleOpenUpload}
          onExploreConnections={(img) => {
            handleSelectImage(img);
            handleNavigate(isAdmin ? ROUTES.ADMIN : ROUTES.HOME);
          }}
          onClose={() => {
            setGalleryTag(null);
            handleNavigate(isAdmin ? ROUTES.ADMIN : ROUTES.HOME);
          }}
        />
      )}

      {/* Right-Side Detail Panel (Image info or Tag related images) */}
      {/* In gallery view, never open tag panel; only open if an image is selected */}
      {((selectedImage) || (selectedTag && currentView !== "gallery")) && (
        <ImageDetailPanel
          image={selectedImage}
          tag={currentView === "gallery" ? null : selectedTag}
          allImages={images}
          isAdmin={isAdmin}
          onClose={() => {
            setSelectedImage(null);
            setSelectedTag(null);
          }}
          onDelete={handleDeleteImage}
          onEdit={handleOpenEdit}
          onSelectTag={handleSelectTag}
          onSelectImage={handleSelectImage}
          onFocusTagInBrain={(t) => {
            setGalleryTag(null);
            setSelectedTag(t);
            handleNavigate(isAdmin ? ROUTES.ADMIN : ROUTES.HOME);
            showToast(`Focused on #${t} cluster`);
          }}
        />
      )}

      {/* Upload & Edit Modal (Admin Only) */}
      {isAdmin && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setEditingImage(null);
          }}
          onSave={handleSaveImage}
          existingTags={allTags}
          initialData={editingImage}
        />
      )}

      {/* Floating Help Button in Bottom Right on all pages */}
      <HelpFloatingButton onNavigate={handleNavigate} />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            {toast.type === "error" ? (
              <ShieldAlert size={15} color="var(--accent-rose)" />
            ) : (
              <CheckCircle2 size={15} color="var(--primary-dark)" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
