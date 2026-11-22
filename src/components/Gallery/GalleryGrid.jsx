import React from "react";
import { ImageCard } from "./ImageCard";
import { Search, X, Image as ImageIcon, Plus } from "lucide-react";

export function GalleryGrid({
  images,
  allTags,
  selectedTag,
  setSelectedTag,
  searchTerm,
  setSearchTerm,
  onImageClick,
  onOpenUpload,
  onExploreConnections,
  onClose,
  isAdmin = false
}) {
  const filteredImages = images.filter((img) => {
    const matchesSearch =
      !searchTerm ||
      img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.aiPrompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.camera?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.lens?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.lighting?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.composition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag = !selectedTag || (img.tags && img.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="floating-gallery-overlay">
      <div style={{ maxWidth: "1600px", margin: "0 auto 16px auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>Archive Gallery</h2>
          <span className="brand-tag">{filteredImages.length} of {images.length} works</span>
        </div>

        <button 
          className="ghost-btn"
          onClick={onClose}
          style={{ padding: "4px 10px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <X size={14} /> Close Gallery
        </button>
      </div>

      {/* Tag Filter Chips */}
      {allTags.length > 0 && (
        <div style={{ maxWidth: "1600px", margin: "0 auto 18px auto", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <button
            className={`tag-chip ${selectedTag === null ? "active" : ""}`}
            onClick={() => setSelectedTag(null)}
          >
            All Works
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-chip ${selectedTag === tag ? "active" : ""}`}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid or Empty State */}
      {filteredImages.length > 0 ? (
        <div className="gallery-grid">
          {filteredImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onClick={onImageClick}
              onTagClick={(tag) => setSelectedTag(tag)}
              onExploreConnections={onExploreConnections}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <div style={{ width: "48px", height: "48px", background: "var(--bg-tertiary)", margin: "0 auto 12px auto", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
            <ImageIcon size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", color: "var(--text-main)", marginBottom: "4px" }}>
            No images match your filter
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", maxWidth: "380px", margin: "0 auto 14px auto" }}>
            Try clearing your search query or selecting a different tag.
          </p>
          <button 
            className="ghost-btn" 
            style={{ margin: "0 auto" }}
            onClick={() => {
              setSearchTerm("");
              setSelectedTag(null);
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
