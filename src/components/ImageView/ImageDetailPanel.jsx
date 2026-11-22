import React, { useState, useEffect } from "react";
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
  Tag as TagIcon, 
  Share2,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Palette,
  Edit3
} from "lucide-react";

export function ImageDetailPanel({
  image,
  tag,
  allImages,
  onClose,
  onDelete,
  onEdit,
  onSelectTag,
  onSelectImage,
  onFocusTagInBrain,
  isAdmin = false
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image loaded & error states whenever selected image changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [image?.id, image?.imageUrl]);

  // If viewing a tag cluster
  if (tag && !image) {
    const relatedImages = allImages.filter((img) => img.tags?.includes(tag));

    return (
      <aside className="detail-side-panel">
        <div className="detail-panel-header">
          <div className="detail-panel-title-wrap">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="brand-tag">Tag Cluster</span>
              <span style={{ fontSize: "0.72rem", color: "var(--primary-dark)", fontWeight: 700 }}>
                {relatedImages.length} Related Visuals
              </span>
            </div>
            <h2 className="detail-panel-title" title={`#${tag}`}>
              #{tag}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {onFocusTagInBrain && (
              <button
                className="ghost-btn"
                style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                onClick={() => onFocusTagInBrain(tag)}
                title="Isolate this tag in Visual Brain"
              >
                <Layers size={13} /> Focus
              </button>
            )}
            <button className="close-modal-btn" onClick={onClose} title="Close panel">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="detail-panel-body">
          <div>
            <h4 className="detail-section-title">
              <TagIcon size={12} color="var(--primary-dark)" />
              Tagged Visuals in Archive ({relatedImages.length})
            </h4>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              Click any visual below to view its creative and photographic techniques.
            </p>

            <div className="tag-related-grid">
              {relatedImages.map((img) => (
                <div
                  key={img.id}
                  className="tag-related-card"
                  onClick={() => onSelectImage(img)}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    className="tag-related-thumb"
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden", flex: 1 }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {img.title}
                    </strong>
                    {img.camera && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        📷 {img.camera} {img.aperture ? `(${img.aperture})` : ""}
                      </span>
                    )}
                    {img.aiModel && (
                      <span style={{ fontSize: "0.68rem", color: "var(--primary-dark)", fontWeight: 600 }}>
                        ✦ {img.aiModel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // If viewing an image
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

  // Resolve image source with fallback
  const imgSrc = image?.imageUrl || image?.url || image?.image || image?.dataUrl || image?.imageDataUrl || "";
  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='100%' height='100%' fill='%230f172a'/><rect x='20' y='20' width='560' height='360' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-dasharray='6 6'/><text x='50%' y='46%' dominant-baseline='middle' text-anchor='middle' fill='%2338bdf8' font-family='sans-serif' font-weight='bold' font-size='18'>${encodeURIComponent(image?.title || 'Visual Artwork')}</text><text x='50%' y='56%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='13'>Visual Brain Archive Artwork</text></svg>`;

  return (
    <aside className="detail-side-panel">
      {/* Panel Header */}
      <div className="detail-panel-header">
        <div className="detail-panel-title-wrap">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="brand-tag">Visual Info</span>
            {image.aiModel && (
              <span style={{ fontSize: "0.72rem", color: "var(--primary-dark)", fontWeight: 700 }}>
                {image.aiModel}
              </span>
            )}
          </div>
          <h2 className="detail-panel-title" title={image.title}>
            {image.title}
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isAdmin && (
            <>
              {onEdit && !confirmDelete && (
                <button
                  className="ghost-btn"
                  style={{ color: "var(--primary-dark)", padding: "5px 8px" }}
                  onClick={() => onEdit(image)}
                  title="Edit visual metadata (Admin Only)"
                >
                  <Edit3 size={14} />
                </button>
              )}
              {confirmDelete ? (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className="ghost-btn"
                    style={{ color: "var(--accent-rose)", borderColor: "var(--accent-rose)", padding: "4px 8px" }}
                    onClick={() => onDelete(image.id)}
                  >
                    Confirm
                  </button>
                  <button
                    className="ghost-btn"
                    style={{ padding: "4px 8px" }}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="ghost-btn"
                  style={{ color: "var(--text-dim)", padding: "5px 8px" }}
                  onClick={() => setConfirmDelete(true)}
                  title="Delete entry (Admin Only)"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}

          <button className="close-modal-btn" onClick={onClose} title="Close detail panel">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Panel Scrollable Body */}
      <div className="detail-panel-body">
        {/* Visual Artwork Preview - Positioned directly above Concept & Narrative */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h4 className="detail-section-title" style={{ marginBottom: 0 }}>
              <ImageIcon size={12} color="var(--primary-dark)" />
              Visual Artwork
            </h4>
            {imgSrc && !imageError && (
              <a
                href={imgSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-expand-link"
                title="Open full-resolution image in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={11} />
                <span>Full Size</span>
              </a>
            )}
          </div>

          <div className="detail-panel-image-wrap">
            {!imageLoaded && !imageError && (
              <div className="detail-image-loading">
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                  Loading visual...
                </span>
              </div>
            )}
            <img
              src={imageError ? fallbackSvg : (imgSrc || fallbackSvg)}
              alt={image.title}
              className="detail-panel-image"
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          </div>
        </div>

        {/* Concept & Narrative Section */}
        <div>
          <h4 className="detail-section-title">Concept & Narrative</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: 1.6 }}>
            {image.description || "No concept description documented for this artwork."}
          </p>
        </div>

        {/* AI Recipe */}
        <div>
          <h4 className="detail-section-title">
            <Sparkles size={12} color="var(--primary-dark)" />
            AI Generation Recipe
          </h4>
          <div className="prompt-box">
            <button
              className="prompt-copy-btn"
              onClick={handleCopyPrompt}
              title="Copy generation prompt"
            >
              {copiedPrompt ? (
                <>
                  <Check size={11} color="var(--accent-emerald)" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
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
                marginTop: "10px", 
                paddingTop: "8px", 
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "0.72rem",
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

        {/* Photographic Techniques */}
        <div>
          <h4 className="detail-section-title">
            <Camera size={12} color="var(--primary-dark)" />
            Photographic Techniques
          </h4>
          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">
                <Camera size={11} /> Camera / Sensor
              </span>
              <span className="spec-value">{image.camera || "Unspecified"}</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">
                <Aperture size={11} /> Lens & Aperture
              </span>
              <span className="spec-value">
                {image.lens ? `${image.lens} ` : ""}
                {image.aperture ? `(${image.aperture})` : ""}
                {!image.lens && !image.aperture && "Unspecified"}
              </span>
            </div>

            <div className="spec-item full-width">
              <span className="spec-label">
                <Sun size={11} /> Lighting Setup
              </span>
              <span className="spec-value">{image.lighting || "Unspecified"}</span>
            </div>

            <div className="spec-item full-width">
              <span className="spec-label">
                <Moon size={11} /> Shadows & Contrast
              </span>
              <span className="spec-value">{image.shadows || "Unspecified"}</span>
            </div>

            <div className="spec-item full-width">
              <span className="spec-label">
                <Compass size={11} /> Framing & Composition
              </span>
              <span className="spec-value">{image.composition || "Unspecified"}</span>
            </div>

            <div className="spec-item full-width">
              <span className="spec-label">
                <Palette size={11} /> Color Grading
              </span>
              <span className="spec-value">{image.colorGrading || image.color_grading || "Unspecified"}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {image.tags && image.tags.length > 0 && (
          <div>
            <h4 className="detail-section-title">
              <TagIcon size={12} color="var(--primary-dark)" />
              Descriptive Tags ({image.tags.length})
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {image.tags.map((t) => (
                <button
                  key={t}
                  className="tag-chip"
                  onClick={() => onSelectTag(t)}
                  title={`View cluster for #${t}`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Connected Works */}
        {connectedImages.length > 0 && (
          <div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              marginBottom: "6px" 
            }}>
              <h4 className="detail-section-title" style={{ margin: 0 }}>
                <Share2 size={12} color="var(--primary-dark)" />
                Connected Works ({connectedImages.length})
              </h4>
              <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>
                Shares tags
              </span>
            </div>

            <div className="connected-images-list">
              {connectedImages.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelectImage(item)}
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "3px" }}
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
    </aside>
  );
}
