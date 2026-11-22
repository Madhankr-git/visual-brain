import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  Camera, 
  Aperture, 
  Sun, 
  Moon, 
  Compass, 
  Tag as TagIcon,
  Plus,
  Check
} from "lucide-react";

export function UploadModal({ 
  isOpen, 
  onClose, 
  onSave, 
  existingTags = [],
  initialData = null 
}) {
  const isEditMode = Boolean(initialData);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  
  // Photographic parameters
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [aperture, setAperture] = useState("");
  const [lighting, setLighting] = useState("");
  const [shadows, setShadows] = useState("");
  const [composition, setComposition] = useState("");
  const [colorGrading, setColorGrading] = useState("");
  
  // AI Generation parameters
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState("Midjourney v6.1");

  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [useUrlMode, setUseUrlMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setImageDataUrl(initialData.imageUrl || "");
      setUrlInput(initialData.imageUrl || "");
      setUseUrlMode(Boolean(initialData.imageUrl && !initialData.imagePath));
      setTags(Array.isArray(initialData.tags) ? [...initialData.tags] : []);
      setCamera(initialData.camera || "");
      setLens(initialData.lens || "");
      setAperture(initialData.aperture || "");
      setLighting(initialData.lighting || "");
      setShadows(initialData.shadows || "");
      setComposition(initialData.composition || "");
      setColorGrading(initialData.colorGrading || "");
      setAiPrompt(initialData.aiPrompt || "");
      setAiModel(initialData.aiModel || "Midjourney v6.1");
      setSelectedFile(null);
      setErrorMessage("");
    } else {
      setTitle("");
      setDescription("");
      setImageDataUrl("");
      setSelectedFile(null);
      setUrlInput("");
      setUseUrlMode(false);
      setTags([]);
      setCamera("");
      setLens("");
      setAperture("");
      setLighting("");
      setShadows("");
      setComposition("");
      setColorGrading("");
      setAiPrompt("");
      setAiModel("Midjourney v6.1");
      setErrorMessage("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    setErrorMessage("");
    setSelectedFile(file); // Store raw File binary for Storage upload

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target.result);
      if (!title) {
        // Derive clean title from filename
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setTitle(cleanName);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || tagInput).trim().toLowerCase().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleKeyDownTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalImage = useUrlMode ? urlInput : imageDataUrl;

    if (!finalImage && !isEditMode) {
      setErrorMessage("Please upload an image or provide an image URL.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Please provide a title for this image.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      tags,
      camera: camera.trim(),
      lens: lens.trim(),
      aperture: aperture.trim(),
      lighting: lighting.trim(),
      shadows: shadows.trim(),
      composition: composition.trim(),
      colorGrading: colorGrading.trim(),
      aiPrompt: aiPrompt.trim(),
      aiModel: aiModel.trim()
    };

    if (useUrlMode && urlInput.trim()) {
      payload.imageUrl = urlInput.trim();
    } else if (initialData?.imageUrl && !selectedFile) {
      payload.imageUrl = initialData.imageUrl;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onSave(payload, selectedFile);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Failed to save visual knowledge record.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div className="detail-modal-title-group">
            <h2 className="detail-modal-title">
              {isEditMode ? "Edit Visual Knowledge" : "Document New Visual"}
            </h2>
            <span className="brand-tag">
              {isEditMode ? "Edit Mode" : "Knowledge Entry"}
            </span>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-modal-body">
          {errorMessage && (
            <div style={{
              padding: "0.65rem 1rem",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#fda4af",
              fontSize: "0.85rem"
            }}>
              {errorMessage}
            </div>
          )}

          {/* 1. Image Upload Area */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label className="form-section-title" style={{ margin: 0 }}>
                <ImageIcon size={14} /> 1. Image Asset
              </label>
              <button
                type="button"
                className="ghost-btn"
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                onClick={() => setUseUrlMode(!useUrlMode)}
              >
                {useUrlMode ? "Upload File from Computer" : "Use Image URL instead"}
              </button>
            </div>

            {useUrlMode ? (
              <div className="form-group">
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/generated-image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                {urlInput && (
                  <div style={{ marginTop: "8px", maxHeight: "180px", overflow: "hidden", borderRadius: "8px" }}>
                    <img src={urlInput} alt="Preview" style={{ width: "100%", maxHeight: "180px", objectFit: "contain" }} />
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`dropzone ${isDragging ? "active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {imageDataUrl ? (
                  <>
                    <img src={imageDataUrl} alt="Upload preview" className="dropzone-preview" />
                    <div className="dropzone-change-overlay">
                      <UploadCloud size={18} /> Click or drag to change image
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      background: "rgba(56, 189, 248, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)"
                    }}>
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <strong style={{ display: "block", color: "var(--text-main)", fontSize: "0.95rem" }}>
                        Click to upload or drag image here
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                        Supports PNG, JPG, WEBP, GIF (stored securely in browser)
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. Core Information */}
          <div>
            <div className="form-section-title">2. Identity & Narrative</div>
            <div className="form-grid-2">
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Cyberpunk Monolith in Rainy Shinjuku"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Concept Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the artistic intent, mood, worldbuilding context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. AI Generation Details */}
          <div>
            <div className="form-section-title">
              <Sparkles size={14} /> 3. AI Generation Recipe
            </div>
            <div className="form-grid-2">
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Prompt & Generation Keywords</label>
                <textarea
                  className="form-textarea"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                  placeholder="The exact prompt, modifiers, lighting cues, engine parameters (--ar 16:9 --v 6.1)..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">AI Model / Generator</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Midjourney v6.1, Flux.1, SD 3.5, DALL-E 3"
                  list="ai-models-list"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                />
                <datalist id="ai-models-list">
                  <option value="Midjourney v6.1" />
                  <option value="Flux.1 Dev" />
                  <option value="Flux.1 Schnell" />
                  <option value="Stable Diffusion 3.5 Large" />
                  <option value="SDXL 1.0" />
                  <option value="DALL-E 3" />
                  <option value="Ideogram v2" />
                </datalist>
              </div>
            </div>
          </div>

          {/* 4. Photographic & Creative Techniques */}
          <div>
            <div className="form-section-title">
              <Camera size={14} /> 4. Photographic & Visual Techniques
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Camera / Sensor Emulation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Sony A7R V, Hasselblad H6D, 35mm film"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lens & Focal Length</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 35mm f/1.4 GM, 50mm Anamorphic, 100mm Macro"
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Aperture / Depth of Field</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., f/1.4, f/2.8, f/8.0, razor-thin DOF"
                  value={aperture}
                  onChange={(e) => setAperture(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Composition & Framing</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Rule of thirds, One-point perspective, Golden spiral"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lighting Style</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Volumetric neon rim light, Harsh zenith sunlight"
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shadows & Contrast</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Deep pitch silhouettes, Soft diffused shadows"
                  value={shadows}
                  onChange={(e) => setShadows(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Color Grading & Tone Palette</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Teal and orange cinematic grade, Muted desaturated cool tones, Warm Kodachrome"
                  value={colorGrading}
                  onChange={(e) => setColorGrading(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 5. Descriptive Tags */}
          <div>
            <div className="form-section-title">
              <TagIcon size={14} /> 5. Descriptive Tags & Connections
            </div>
            <div className="form-group">
              <label className="form-label">
                Tags connect this image with other images in the Visual Brain network
              </label>
              <div className="tag-input-box">
                {tags.map((t) => (
                  <span key={t} className="tag-badge">
                    #{t}
                    <button
                      type="button"
                      className="tag-remove-btn"
                      onClick={() => handleRemoveTag(t)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tag-field-input"
                  placeholder="Type tag and press Enter or comma..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  onBlur={() => tagInput.trim() && handleAddTag()}
                />
              </div>

              {/* Suggestions from existing tags */}
              {existingTags.length > 0 && (
                <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Suggestions:</span>
                  {existingTags
                    .filter((t) => !tags.includes(t))
                    .slice(0, 8)
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="tag-chip"
                        style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                        onClick={() => handleAddTag(t)}
                      >
                        +{t}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="upload-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Saving...</span>
              ) : isEditMode ? (
                <>
                  <Check size={16} /> Save Changes
                </>
              ) : (
                <>
                  <Plus size={16} /> Save to Visual Library
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
