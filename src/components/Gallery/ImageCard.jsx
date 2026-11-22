import React, { useState } from "react";
import { Camera, Aperture, Maximize2, Share2, Sparkles, Tag } from "lucide-react";

export function ImageCard({ image, onClick, onTagClick, onExploreConnections }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="image-card" onClick={() => onClick(image)}>
      <div className="image-card-thumb-wrapper">
        {!imageLoaded && !hasError && (
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            background: "var(--bg-tertiary)"
          }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Loading visual...</span>
          </div>
        )}

        <img
          src={hasError ? "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%2311131a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-size='14' font-family='sans-serif'>Image unavailable</text></svg>" : image.imageUrl}
          alt={image.title}
          className="image-card-thumb"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setHasError(true);
            setImageLoaded(true);
          }}
        />

        {/* AI Model Badge */}
        {image.aiModel && (
          <div className="image-card-ai-badge">
            <Sparkles size={11} />
            <span>{image.aiModel}</span>
          </div>
        )}

        {/* Quick Action Overlay */}
        <div className="image-card-overlay-actions">
          <button
            className="icon-action-btn"
            title="Inspect Details"
            onClick={(e) => {
              e.stopPropagation();
              onClick(image);
            }}
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="icon-action-btn"
            title="Explore Tag Connections"
            onClick={(e) => {
              e.stopPropagation();
              onExploreConnections(image);
            }}
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <div className="image-card-content">
        <h3 className="image-card-title">{image.title}</h3>

        {/* Photographic Quick Specs */}
        {(image.camera || image.aperture || image.lens) && (
          <div className="image-card-camera-specs">
            {image.camera && (
              <span title={`Camera: ${image.camera}`}>
                <Camera size={12} /> {image.camera}
              </span>
            )}
            {image.aperture && (
              <span title={`Aperture: ${image.aperture}`}>
                <Aperture size={12} /> {image.aperture}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {image.tags && image.tags.length > 0 && (
          <div className="image-card-tags">
            {image.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="card-tag"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                title={`Filter by #${tag}`}
              >
                #{tag}
              </span>
            ))}
            {image.tags.length > 4 && (
              <span className="card-tag" style={{ color: "var(--primary)" }}>
                +{image.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
