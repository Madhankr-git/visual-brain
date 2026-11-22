-- ==============================================================================
-- Visual Brain — Milestone 2: Schema Update
-- Migration: 20261122000001_update_image_metadata_color_grading.sql
-- Description:
--   1. Drops the obsolete `ai_seed` column from `public.images`.
--   2. Adds `color_grading TEXT NOT NULL DEFAULT ''` to `public.images` to
--      support manual documentation of color grading, palettes, and toning.
-- ==============================================================================

-- 1. Remove obsolete ai_seed column from images table
ALTER TABLE public.images DROP COLUMN IF EXISTS ai_seed;

-- 2. Add color_grading column for visual archive documentation
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS color_grading text NOT NULL DEFAULT '';

-- 3. Document column purpose in PostgreSQL catalog
COMMENT ON COLUMN public.images.color_grading IS 'Manual creative color grading notes (color palettes, split-toning, contrast curves, LUT/film stock emulation).';
