-- ==============================================================================
-- Visual Brain — Milestone 1: Storage Bucket & Policies
-- Migration: 20261121000002_create_storage_bucket_and_policies.sql
-- Description: Creates the 'visual-brain-images' public bucket, sets upload size
--              limits, restricts MIME types, and establishes storage RLS policies.
-- ==============================================================================

-- 1. BUCKET PROVISIONING: visual-brain-images
-- Configured as public read-only for web presentation, with 10MB file limit
-- and strictly whitelisted raster formats (PNG, JPEG, WEBP, GIF).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visual-brain-images',
  'visual-brain-images',
  true,
  10485760, -- 10MB limit (10 * 1024 * 1024 bytes)
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- storage.objects table already has RLS enabled by default in Supabase.

-- Policy: Public Read Access
-- Anonymous visitors and authenticated users can view curated archive images.
DROP POLICY IF EXISTS "Allow public read access to visual-brain-images" ON storage.objects;
CREATE POLICY "Allow public read access to visual-brain-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'visual-brain-images');

-- Policy: Admin Upload (Insert)
-- Only the verified administrator can upload new image files.
DROP POLICY IF EXISTS "Allow admin upload to visual-brain-images" ON storage.objects;
CREATE POLICY "Allow admin upload to visual-brain-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'visual-brain-images'
    AND public.is_admin()
  );

-- Policy: Admin Update
-- Only the verified administrator can update image files.
DROP POLICY IF EXISTS "Allow admin update to visual-brain-images" ON storage.objects;
CREATE POLICY "Allow admin update to visual-brain-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'visual-brain-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'visual-brain-images'
    AND public.is_admin()
  );

-- Policy: Admin Delete
-- Only the verified administrator can remove image files from storage.
DROP POLICY IF EXISTS "Allow admin delete from visual-brain-images" ON storage.objects;
CREATE POLICY "Allow admin delete from visual-brain-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'visual-brain-images'
    AND public.is_admin()
  );
