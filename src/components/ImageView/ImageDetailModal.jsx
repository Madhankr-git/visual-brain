import React, { useState } from "react";
import { 
  X, 
  Camera, 
  Aperture, 
  Sun, 
  Moon, 
  Compass, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Share2, 
  Tag, 
  ExternalLink,
  Palette 
} from "lucide-react";

export function ImageDetailModal({
  image,
  allImages,
  onClose,
  onDelete,
  onSelectTag,
  onSelectImage,
  onExploreConnections
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!image) return null;

  // Find related images that share tags
  const connectedImages = allImages
    .filter((other) => other.id !== image.id)
    .map((other) => {
      const shared = (image.tags || []).filter((t) => (other.tags || []).includes(t));
      return { ...other, sharedTags: shared };
    })
    .filter((other) => other.sharedTags.length > 0)
    .sort((a, b) => b.sharedTags.length - a.sharedTags.length);

  const handleCopyPrompt = () => {
    if (!image.aiPrompt) return;
    navigator.clipboard.writeText(image.aiPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="image-detail-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="detail-modal-header">
          <div className="detail-modal-title-group">
            <h2 className="detail-modal-title">{image.title}</h2>
            {image.aiModel && (
              <span className="brand-tag">
                <Sparkles size={11} style={{ display: "inline", marginRight: "4px" }} />
                {image.aiModel}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="ghost-btn"
              onClick={() => {
                onExploreConnections(image);
                onClose();
              }}
              title="View in Connections Graph"
            >
              <Share2 size={14} />
              <span>Explore Graph</span>
            </button>

            {confirmDelete ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="ghost-btn"
                  style={{ color: "var(--accent-rose)", borderColor: "var(--accent-rose)" }}
                  onClick={() => onDelete(image.id)}
                >
                  Confirm Delete
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="ghost-btn"
                style={{ color: "var(--text-dim)" }}
                onClick={() => setConfirmDelete(true)}
                title="Delete this image"
              >
                <Trash2 size={14} />
              </button>
            )}

            <button className="close-modal-btn" onClick={onClose} title="Close view">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="detail-modal-body">
          {/* Left: Full Visual Presentation */}
          <div className="detail-modal-image-side">
            <img
              src={image.imageUrl}
              alt={image.title}
              className="detail-full-image"
            />
          </div>

          {/* Right: Technical & Creative Metadata */}
          <div className="detail-modal-info-side">
            {/* Visual Artwork Preview */}
            <div className="detail-modal-mobile-image" style={{ marginBottom: "14px" }}>
              <div className="detail-panel-image-wrap" style={{ height: "220px" }}>
                <img
                  src={image.imageUrl || image.url || image.image}
                  alt={image.title}
                  className="detail-panel-image"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="detail-section-title">Concept & Narrative</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                {image.description || "No concept description documented for this artwork."}
              </p>
            </div>

            {/* AI Generation Recipe */}
            <div>
              <h4 className="detail-section-title">
                <Sparkles size={13} color="var(--accent-cyan)" />
                AI Generation Prompt & Recipe
              </h4>
              <div className="prompt-box">
                <button
                  className="prompt-copy-btn"
                  onClick={handleCopyPrompt}
                  title="Copy full generation prompt"
                >
                  {copiedPrompt ? (
                    <>
                      <Check size={12} color="var(--accent-emerald)" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
                <p className="prompt-text">
                  {image.aiPrompt || "No prompt documented."}
                </p>

                {image.aiModel && (
                  <div style={{ 
                    display: "flex", 
                    gap: "12px", 
                    marginTop: "12px", 
                    paddingTop: "10px", 
                    borderTop: "1px solid var(--border-subtle)",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)"
                  }}>
                    <div>
                      <span style={{ color: "var(--text-dim)" }}>Engine: </span>
                      <strong style={{ color: "var(--text-main)" }}>{image.aiModel}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Photographic & Cinematographic Techniques */}
            <div>
              <h4 className="detail-section-title">
                <Camera size={13} color="var(--accent-indigo)" />
                Photographic & Creative Techniques
              </h4>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">
                    <Camera size={12} /> Camera / Sensor
                  </span>
                  <span className="spec-value">{image.camera || "Unspecified"}</span>
                </div>

                <div className="spec-item">
                  <span className="spec-label">
                    <Aperture size={12} /> Lens & Aperture
                  </span>
                  <span className="spec-value">
                    {image.lens ? `${image.lens} ` : ""}
                    {image.aperture ? `(${image.aperture})` : ""}
                    {!image.lens && !image.aperture && "Unspecified"}
                  </span>
                </div>

                <div className="spec-item full-width">
                  <span className="spec-label">
                    <Sun size={12} /> Lighting Setup
                  </span>
                  <span className="spec-value">{image.lighting || "Unspecified"}</span>
                </div>

                <div className="spec-item full-width">
                  <span className="spec-label">
                    <Moon size={12} /> Shadows & Contrast
                  </span>
                  <span className="spec-value">{image.shadows || "Unspecified"}</span>
                </div>

                <div className="spec-item full-width">
                  <span className="spec-label">
                    <Compass size={12} /> Framing & Composition
                  </span>
                  <span className="spec-value">{image.composition || "Unspecified"}</span>
                </div>

                <div className="spec-item full-width">
                  <span className="spec-label">
                    <Palette size={12} /> Color Grading
                  </span>
                  <span className="spec-value">{image.colorGrading || image.color_grading || "Unspecified"}</span>
                </div>
              </div>
            </div>

            {/* Descriptive Tags */}
            {image.tags && image.tags.length > 0 && (
              <div>
                <h4 className="detail-section-title">
                  <Tag size={13} color="var(--accent-purple)" />
                  Descriptive Tags ({image.tags.length})
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {image.tags.map((tag) => (
                    <button
                      key={tag}
                      className="tag-chip"
                      onClick={() => {
                        onSelectTag(tag);
                        onClose();
                      }}
                      title={`Filter gallery by #${tag}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Visuals in Library */}
            {connectedImages.length > 0 && (
              <div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: "8px" 
                }}>
                  <h4 className="detail-section-title" style={{ margin: 0 }}>
                    <Share2 size={13} color="var(--accent-cyan)" />
                    Connected Works ({connectedImages.length})
                  </h4>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                    Via shared tags
                  </span>
                </div>

                <div className="connected-images-list">
                  {connectedImages.slice(0, 6).map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => onSelectImage(item)}
                      style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "4px" }}
                      title={`${item.title} (shares: ${item.sharedTags.join(", ")})`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="connected-image-thumb"
                      />
                      <span style={{ 
                        fontSize: "0.68rem", 
                        color: "var(--text-muted)", 
                        maxWidth: "90px", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap" 
                      }}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
