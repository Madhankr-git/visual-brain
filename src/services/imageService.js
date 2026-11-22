/**
 * Visual Brain — Supabase Image Data Service
 * File: src/services/imageService.js
 * 
 * Provides centralized, Supabase-backed CRUD operations for the visual knowledge archive.
 * Interacts with:
 *   - Database table: `public.images`
 *   - Storage bucket: `visual-brain-images`
 * 
 * Maps database snake_case fields to frontend camelCase VisualBrainImage model.
 */

import { supabase } from './supabase';

export const STORAGE_BUCKET = 'visual-brain-images';
export const UPLOAD_FOLDER_PREFIX = 'madhankr/uploads';

/**
 * Maps a database record (snake_case) to the frontend VisualBrainImage model (camelCase).
 * Resolves the public CDN URL for images backed by Supabase Storage.
 * 
 * @param {Object} record - Row from public.images
 * @returns {Object|null} Frontend image object
 */
export function mapDatabaseToFrontend(record) {
  if (!record) return null;

  let publicUrl = record.image_url || null;

  // Resolve public Storage URL if an image_path is documented
  if (record.image_path) {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(record.image_path);
    if (data?.publicUrl) {
      publicUrl = record.image_url || data.publicUrl;
    }
  }

  return {
    id: record.id,
    title: record.title || '',
    description: record.description || '',
    imagePath: record.image_path || null,
    imageUrl: publicUrl || '',
    aiPrompt: record.ai_prompt || '',
    aiModel: record.ai_model || '',
    colorGrading: record.color_grading || '',
    camera: record.camera || '',
    lens: record.lens || '',
    aperture: record.aperture || '',
    lighting: record.lighting || '',
    shadows: record.shadows || '',
    composition: record.composition || '',
    tags: Array.isArray(record.tags) ? record.tags : [],
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

/**
 * Maps frontend image data (camelCase) to database columns (snake_case).
 * Only includes columns that genuinely exist in public.images.
 * 
 * @param {Object} imageData - Frontend image data
 * @param {Object} [overrides] - Optional overrides (e.g. resolved imagePath / imageUrl)
 * @returns {Object} Database payload
 */
export function mapFrontendToDatabase(imageData = {}, overrides = {}) {
  const payload = {};

  if (imageData.title !== undefined) {
    payload.title = String(imageData.title).trim();
  }
  if (imageData.description !== undefined) {
    payload.description = String(imageData.description).trim();
  }

  // Handle image path & URL (with overrides taking precedence)
  if (overrides.imagePath !== undefined) {
    payload.image_path = overrides.imagePath;
  } else if (imageData.imagePath !== undefined) {
    payload.image_path = imageData.imagePath;
  }

  if (overrides.imageUrl !== undefined) {
    payload.image_url = overrides.imageUrl;
  } else if (imageData.imageUrl !== undefined) {
    payload.image_url = imageData.imageUrl;
  }

  // AI Generation parameters
  if (imageData.aiPrompt !== undefined) {
    payload.ai_prompt = String(imageData.aiPrompt).trim();
  }
  if (imageData.aiModel !== undefined) {
    payload.ai_model = String(imageData.aiModel).trim();
  }

  // Photographic & Creative parameters
  if (imageData.colorGrading !== undefined) {
    payload.color_grading = String(imageData.colorGrading).trim();
  }
  if (imageData.camera !== undefined) {
    payload.camera = String(imageData.camera).trim();
  }
  if (imageData.lens !== undefined) {
    payload.lens = String(imageData.lens).trim();
  }
  if (imageData.aperture !== undefined) {
    payload.aperture = String(imageData.aperture).trim();
  }
  if (imageData.lighting !== undefined) {
    payload.lighting = String(imageData.lighting).trim();
  }
  if (imageData.shadows !== undefined) {
    payload.shadows = String(imageData.shadows).trim();
  }
  if (imageData.composition !== undefined) {
    payload.composition = String(imageData.composition).trim();
  }

  // Tags array
  if (imageData.tags !== undefined) {
    payload.tags = Array.isArray(imageData.tags)
      ? imageData.tags
          .map((t) => String(t).trim().toLowerCase().replace(/^#/, ''))
          .filter(Boolean)
      : [];
  }

  return payload;
}

/**
 * Parses and sanitizes an uploaded file's original name and extension.
 * Strips path traversal, replaces spaces and unsafe characters with hyphens.
 * Preserves the original file base name and extension.
 * 
 * @param {string} filename 
 * @returns {{ baseName: string, extension: string }}
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return { baseName: 'image', extension: 'webp' };
  }

  // Strip directory paths (e.g. C:\fakepath\image.jpg or /uploads/image.jpg)
  const cleanName = filename.replace(/^.*[\\/]/, '').trim();
  const lastDotIndex = cleanName.lastIndexOf('.');

  let rawBase = lastDotIndex > 0 ? cleanName.substring(0, lastDotIndex) : cleanName;
  let rawExt = lastDotIndex > 0 ? cleanName.substring(lastDotIndex + 1).toLowerCase() : '';

  // Whitelist safe image extensions
  if (rawExt === 'jpeg') rawExt = 'jpg';
  if (!['png', 'jpg', 'webp', 'gif'].includes(rawExt)) {
    rawExt = rawExt || 'webp';
  }

  // Sanitize base name: lowercased, safe URL characters, collapsed hyphens
  let baseName = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!baseName) {
    baseName = 'image';
  }

  return { baseName, extension: rawExt };
}

/**
 * Resolves a collision-free storage path following the structure:
 *   `madhankr/uploads/<original-filename>`
 * If `<filename>` already exists in Storage or the database, appends `-2`, `-3`, etc.:
 *   - surreal-garden.webp
 *   - surreal-garden-2.webp
 *   - surreal-garden-3.webp
 * 
 * @param {File|Blob} file - Uploaded file
 * @returns {Promise<string>} Unique relative path within the storage bucket
 */
export async function resolveUniqueStoragePath(file) {
  const originalName = file?.name || 'image.webp';
  const { baseName, extension } = sanitizeFilename(originalName);

  // 1. Fetch existing filenames in madhankr/uploads from Storage
  const { data: storageFiles } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(UPLOAD_FOLDER_PREFIX, { limit: 1000 });

  const existingStorageNames = new Set((storageFiles || []).map((f) => f.name));

  // 2. Query database for any matching image_path in madhankr/uploads/
  const { data: dbRecords } = await supabase
    .from('images')
    .select('image_path')
    .ilike('image_path', `${UPLOAD_FOLDER_PREFIX}/${baseName}%`);

  const existingDbPaths = new Set((dbRecords || []).map((r) => r.image_path).filter(Boolean));

  // 3. Resolve duplicate filenames by adding numeric suffix
  let candidateFilename = `${baseName}.${extension}`;
  let candidatePath = `${UPLOAD_FOLDER_PREFIX}/${candidateFilename}`;
  let counter = 2;

  while (existingStorageNames.has(candidateFilename) || existingDbPaths.has(candidatePath)) {
    candidateFilename = `${baseName}-${counter}.${extension}`;
    candidatePath = `${UPLOAD_FOLDER_PREFIX}/${candidateFilename}`;
    counter++;
  }

  return candidatePath;
}

/**
 * Backward compatibility alias for resolveUniqueStoragePath.
 */
export const generateSafeStoragePath = resolveUniqueStoragePath;

/**
 * Resolves content MIME type for whitelisted raster storage.
 * 
 * @param {File|Blob} file - The file
 * @param {string} filePath - Path with extension
 * @returns {string} Content-Type header
 */
function resolveContentType(file, filePath) {
  if (file?.type && file.type.startsWith('image/')) {
    return file.type;
  }
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

/**
 * Fetches all visual knowledge images from Supabase.
 * Read-only public query (granted to anon and authenticated roles).
 * 
 * @returns {Promise<Array<Object>>} List of mapped image objects, ordered newest first
 */
export async function getImages() {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const msg = `[ImageService:getImages] Failed to fetch images: ${error.message} (Code: ${error.code || 'UNKNOWN'})`;
    console.error(msg, error);
    throw new Error(msg);
  }

  return (data || []).map(mapDatabaseToFrontend);
}

/**
 * Fetches a single visual knowledge image by its UUID.
 * 
 * @param {string} id - Image UUID
 * @returns {Promise<Object|null>} Mapped image object or null if not found
 */
export async function getImageById(id) {
  if (!id) {
    throw new Error('[ImageService:getImageById] An image ID is required.');
  }

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 indicates 0 rows found for single() query
    if (error.code === 'PGRST116') {
      return null;
    }
    const msg = `[ImageService:getImageById] Failed to fetch image "${id}": ${error.message}`;
    console.error(msg, error);
    throw new Error(msg);
  }

  return mapDatabaseToFrontend(data);
}

/**
 * Creates a new image in Visual Brain:
 *   1. Uploads the image binary to Supabase Storage (if provided).
 *   2. Inserts the metadata record into `public.images`.
 *   3. Rolls back the storage upload if database insertion fails.
 * 
 * @param {Object} imageData - Metadata fields (title, description, tags, photography, AI recipe)
 * @param {File|Blob} [imageFile] - Optional raw image binary for Storage upload
 * @returns {Promise<Object>} Newly created image record (camelCase)
 */
export async function createImage(imageData, imageFile = null) {
  if (!imageData || typeof imageData !== 'object') {
    throw new Error('[ImageService:createImage] Image metadata object is required.');
  }

  const cleanTitle = imageData.title ? String(imageData.title).trim() : '';
  if (!cleanTitle) {
    throw new Error('[ImageService:createImage] Image title is required and cannot be empty.');
  }

  let uploadedFilePath = null;
  let resolvedPublicUrl = null;

  // 1. Upload file to Supabase Storage if provided
  if (imageFile) {
    const filePath = await resolveUniqueStoragePath(imageFile);
    const contentType = resolveContentType(imageFile, filePath);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, imageFile, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      const msg = `[ImageService:createImage] Storage upload failed: ${uploadError.message}`;
      console.error(msg, uploadError);
      throw new Error(msg);
    }

    uploadedFilePath = filePath;

    // Resolve public URL for newly uploaded asset
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    resolvedPublicUrl = publicUrlData?.publicUrl || null;
  }

  // Ensure at least one image source exists (satisfies check_has_image_source constraint)
  const finalPath = uploadedFilePath || imageData.imagePath || null;
  const finalUrl = resolvedPublicUrl || imageData.imageUrl || null;

  if (!finalPath && !finalUrl) {
    throw new Error('[ImageService:createImage] An image file or an existing image URL/path must be provided.');
  }

  // 2. Prepare database payload (snake_case)
  const dbPayload = mapFrontendToDatabase(imageData, {
    imagePath: finalPath,
    imageUrl: finalUrl,
  });

  // 3. Insert record into public.images
  const { data, error: insertError } = await supabase
    .from('images')
    .insert(dbPayload)
    .select()
    .single();

  if (insertError) {
    // Rollback: Clean up orphaned Storage asset if database insertion failed
    if (uploadedFilePath) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([uploadedFilePath]);
      } catch (cleanupErr) {
        console.warn(`[ImageService:createImage] Failed to rollback uploaded file "${uploadedFilePath}":`, cleanupErr);
      }
    }

    const msg = `[ImageService:createImage] Database insert failed: ${insertError.message}`;
    console.error(msg, insertError);
    throw new Error(msg);
  }

  return mapDatabaseToFrontend(data);
}

/**
 * Updates an existing image record's metadata.
 * Requires administrator authentication per RLS policy.
 * 
 * @param {string} id - Image UUID
 * @param {Object} imageData - Fields to update
 * @returns {Promise<Object>} Updated image object (camelCase)
 */
export async function updateImage(id, imageData) {
  if (!id) {
    throw new Error('[ImageService:updateImage] An image ID is required.');
  }
  if (!imageData || typeof imageData !== 'object') {
    throw new Error('[ImageService:updateImage] Update data object is required.');
  }

  // If title is being updated, ensure it satisfies check_title_not_empty
  if (imageData.title !== undefined && !String(imageData.title).trim()) {
    throw new Error('[ImageService:updateImage] Image title cannot be empty.');
  }

  const dbPayload = mapFrontendToDatabase(imageData);

  if (Object.keys(dbPayload).length === 0) {
    throw new Error('[ImageService:updateImage] No valid updatable fields provided.');
  }

  const { data, error } = await supabase
    .from('images')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const msg = `[ImageService:updateImage] Failed to update image "${id}": ${error.message}`;
    console.error(msg, error);
    throw new Error(msg);
  }

  return mapDatabaseToFrontend(data);
}

/**
 * Deletes an image record from public.images and removes its associated Storage object.
 * Requires administrator authentication per RLS policy.
 * 
 * @param {string} id - Image UUID
 * @returns {Promise<{ success: boolean, id: string, storageRemoved: boolean }>}
 */
export async function deleteImage(id) {
  if (!id) {
    throw new Error('[ImageService:deleteImage] An image ID is required.');
  }

  // 1. Fetch image record to retrieve its image_path before deletion
  const { data: existing, error: fetchError } = await supabase
    .from('images')
    .select('id, image_path')
    .eq('id', id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    const msg = `[ImageService:deleteImage] Failed to verify image prior to deletion: ${fetchError.message}`;
    console.error(msg, fetchError);
    throw new Error(msg);
  }

  if (!existing) {
    throw new Error(`[ImageService:deleteImage] Image with ID "${id}" was not found.`);
  }

  // 2. Delete database record under RLS policy protection
  const { error: deleteDbError } = await supabase
    .from('images')
    .delete()
    .eq('id', id);

  if (deleteDbError) {
    const msg = `[ImageService:deleteImage] Failed to delete database record: ${deleteDbError.message}`;
    console.error(msg, deleteDbError);
    throw new Error(msg);
  }

  // 3. Remove associated Storage object only when a valid image_path is known
  let storageRemoved = false;
  if (existing.image_path && typeof existing.image_path === 'string' && existing.image_path.trim().length > 0) {
    try {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([existing.image_path]);

      if (storageError) {
        console.warn(`[ImageService:deleteImage] Database record deleted, but Storage object removal failed for "${existing.image_path}": ${storageError.message}`);
      } else {
        storageRemoved = true;
      }
    } catch (storageErr) {
      console.warn(`[ImageService:deleteImage] Unexpected error removing Storage object "${existing.image_path}":`, storageErr);
    }
  }

  return { success: true, id, storageRemoved };
}

export const ImageService = {
  getImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
  mapDatabaseToFrontend,
  mapFrontendToDatabase,
  sanitizeFilename,
  resolveUniqueStoragePath,
  generateSafeStoragePath,
  STORAGE_BUCKET,
  UPLOAD_FOLDER_PREFIX,
};

export default ImageService;
