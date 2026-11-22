-- ==============================================================================
-- Visual Brain — Milestone 1: Database Schema & Authentication Foundation
-- Migration: 20261121000001_create_images_and_admin_schema.sql
-- Description: Sets up production tables (images, admin_users), updated_at trigger,
--              GIN and sorting indexes, RLS policies, table grants, and is_admin() function.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLE: public.images
-- Stores the visual knowledge archive records, photographic techniques, and AI parameters.
CREATE TABLE IF NOT EXISTS public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_path text,
  image_url text,
  ai_prompt text NOT NULL DEFAULT '',
  ai_model text NOT NULL DEFAULT '',
  ai_seed text NOT NULL DEFAULT '',
  camera text NOT NULL DEFAULT '',
  lens text NOT NULL DEFAULT '',
  aperture text NOT NULL DEFAULT '',
  lighting text NOT NULL DEFAULT '',
  shadows text NOT NULL DEFAULT '',
  composition text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Validation Constraints
  CONSTRAINT check_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT check_has_image_source CHECK (image_path IS NOT NULL OR image_url IS NOT NULL)
);

-- Indexing for high-performance canvas graph traversals and queries
CREATE INDEX IF NOT EXISTS idx_images_tags ON public.images USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_images_created_at_desc ON public.images (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_title ON public.images (title);

-- Trigger: Automatically refresh updated_at on record mutation
DROP TRIGGER IF EXISTS set_images_updated_at ON public.images;
CREATE TRIGGER set_images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. TABLE: public.admin_users
-- Links to Supabase Auth (auth.users). 
-- Enforces a strict single-administrator constraint at the database engine level.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Database constraint enforcing at most 1 administrator row in V1:
  is_singleton boolean NOT NULL DEFAULT true UNIQUE CHECK (is_singleton IS TRUE),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_admin_user UNIQUE (user_id)
);

-- 5. SECURITY DEFINER HELPER FUNCTION: public.is_admin()
-- Evaluates whether the currently calling identity is the registered administrator.
-- Uses SECURITY DEFINER and fixed search_path to prevent path hijacking.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- Restrict helper function execution to authenticated users
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 6. PERMISSIONS & TABLE GRANTS
REVOKE ALL ON TABLE public.images FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;

-- Images: Public read; Authenticated write
GRANT SELECT ON TABLE public.images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.images TO authenticated;

-- Admin Users: Only authenticated users can read (further protected by RLS); anon has no access
GRANT SELECT ON TABLE public.admin_users TO authenticated;

-- 7. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR public.images

-- Public / Anonymous read access: anyone can view published visual records
CREATE POLICY "Allow public read access to images"
  ON public.images
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin Insert: only verified administrator can add new visual records
CREATE POLICY "Allow admin to insert images"
  ON public.images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin Update: only verified administrator can edit visual records
CREATE POLICY "Allow admin to update images"
  ON public.images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin Delete: only verified administrator can delete visual records
CREATE POLICY "Allow admin to delete images"
  ON public.images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 9. RLS POLICIES FOR public.admin_users

-- Anonymous access: Strictly denied (no anon policy).
-- Admin read: Registered administrator can inspect their own administrator row.
CREATE POLICY "Allow admin to view own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin());

-- Notice: No INSERT, UPDATE, or DELETE policies exist for public.admin_users.
-- Administration records can only be provisioned via database migrations, direct SQL,
-- or service-role management scripts. Arbitrary clients cannot elevate themselves.
