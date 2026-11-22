-- ==============================================================================
-- Visual Brain — Milestone 1: Comprehensive Security & RLS Verification Suite
-- File: supabase/tests/verify_security_and_rls.sql
-- Description: Strictly read-only verification of schema, column types,
--              nullability, defaults, constraints, indexes, table grants,
--              function execution permissions, storage bucket configuration,
--              and granular RLS policy rules (command, roles, USING, WITH CHECK).
--
-- IMPORTANT ARCHITECTURAL NOTE:
-- This script performs deep PostgreSQL catalog inspection to verify that the
-- database schema, constraints, grants, and RLS policies are accurately configured
-- according to migration specifications. Catalog inspection proves that the security
-- rules and definitions exist exactly as intended.
--
-- For multi-tenant or multi-bucket resources (e.g. storage.objects), catalog text
-- inspection enforces a conservative fail-closed isolation principle: any write
-- policy that cannot be deterministically proven from catalog expressions to exclude
-- visual-brain-images (or that relies on complex disjunctions/dynamic logic) is rejected.
-- Complete end-to-end runtime authorization assurance across all possible client API
-- requests will be validated through live integration testing in Milestone 2.
--
-- EXECUTION INSTRUCTIONS:
-- Safe to run directly in the Supabase Dashboard SQL Editor or via Supabase CLI.
-- This script is strictly read-only, creates no temporary tables, and performs zero mutations.
-- ==============================================================================

-- ==============================================================================
-- TEST 1 — REQUIRED EXTENSIONS
-- ==============================================================================
DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'),
    'Test 1 Failed: uuid-ossp extension is missing from pg_extension.';
  ASSERT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'),
    'Test 1 Failed: pgcrypto extension is missing from pg_extension.';
  RAISE NOTICE '✓ [PASS] Test 1: Required extensions (uuid-ossp, pgcrypto) are installed and active.';
END $$;

-- ==============================================================================
-- TEST 2 — IMAGES TABLE STRUCTURE, DATA TYPES, DEFAULTS & CONSTRAINTS
-- ==============================================================================
DO $$
DECLARE
  v_mismatch record;
  v_pk_cols text[];
  v_has_title_check boolean;
  v_has_source_check boolean;
BEGIN
  -- 2a. Verify all 17 columns with exact data types, nullability, and default expressions
  -- Using an in-memory VALUES expression (strictly read-only, zero table creation)
  -- Checks both presence and absence of defaults:
  -- If expected default is NULL (title, image_path, image_url), asserts column_default IS NULL.
  -- If default is expected, asserts column_default IS NOT NULL and matches pattern.
  FOR v_mismatch IN
    WITH expected_columns(col_name, exp_udt, exp_nullable, exp_default_pattern) AS (
      VALUES
        ('id',          'uuid',        'NO',  '%gen_random_uuid()%'),
        ('title',       'text',        'NO',  NULL::text),
        ('description', 'text',        'NO',  '%''''::text%'),
        ('image_path',  'text',        'YES', NULL::text),
        ('image_url',   'text',        'YES', NULL::text),
        ('ai_prompt',   'text',        'NO',  '%''''::text%'),
        ('ai_model',    'text',        'NO',  '%''''::text%'),
        ('color_grading', 'text',      'NO',  '%''''::text%'),
        ('camera',      'text',        'NO',  '%''''::text%'),
        ('lens',        'text',        'NO',  '%''''::text%'),
        ('aperture',    'text',        'NO',  '%''''::text%'),
        ('lighting',    'text',        'NO',  '%''''::text%'),
        ('shadows',     'text',        'NO',  '%''''::text%'),
        ('composition', 'text',        'NO',  '%''''::text%'),
        ('tags',        '_text',       'NO',  '%''{}''::text[]%'),
        ('created_at',  'timestamptz', 'NO',  '%now()%'),
        ('updated_at',  'timestamptz', 'NO',  '%now()%')
    )
    SELECT 
      e.col_name,
      e.exp_udt,
      c.udt_name AS actual_udt,
      e.exp_nullable,
      c.is_nullable AS actual_nullable,
      e.exp_default_pattern,
      c.column_default AS actual_default,
      CASE 
        WHEN c.column_name IS NULL THEN 'MISSING'
        WHEN c.udt_name <> e.exp_udt THEN 'TYPE_MISMATCH'
        WHEN c.is_nullable <> e.exp_nullable THEN 'NULLABILITY_MISMATCH'
        WHEN e.exp_default_pattern IS NULL AND c.column_default IS NOT NULL THEN 'UNEXPECTED_DEFAULT'
        WHEN e.exp_default_pattern IS NOT NULL AND (c.column_default IS NULL OR c.column_default NOT LIKE e.exp_default_pattern) THEN 'DEFAULT_MISMATCH'
        ELSE 'OK'
      END AS status
    FROM expected_columns e
    LEFT JOIN information_schema.columns c
      ON c.table_schema = 'public' 
     AND c.table_name = 'images' 
     AND c.column_name = e.col_name
    WHERE c.column_name IS NULL 
       OR c.udt_name <> e.exp_udt
       OR c.is_nullable <> e.exp_nullable
       OR (e.exp_default_pattern IS NULL AND c.column_default IS NOT NULL)
       OR (e.exp_default_pattern IS NOT NULL AND (c.column_default IS NULL OR c.column_default NOT LIKE e.exp_default_pattern))
  LOOP
    RAISE EXCEPTION 'Test 2 Failed on column "%": status=%, expected (udt: %, nullable: %, default_like: %), got (udt: %, nullable: %, default: %)',
      v_mismatch.col_name, v_mismatch.status, v_mismatch.exp_udt, v_mismatch.exp_nullable, COALESCE(v_mismatch.exp_default_pattern, 'NULL'),
      v_mismatch.actual_udt, v_mismatch.actual_nullable, COALESCE(v_mismatch.actual_default, 'NULL');
  END LOOP;

  -- 2b. Verify Primary Key is specifically on (id)
  SELECT array_agg(a.attname::text ORDER BY array_position(c.conkey, a.attnum)) INTO v_pk_cols
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
  WHERE n.nspname = 'public' AND t.relname = 'images' AND c.contype = 'p';

  ASSERT v_pk_cols = ARRAY['id']::text[],
    format('Test 2 Failed: Primary key on public.images must be specifically on (id). Found: %s.', v_pk_cols);

  -- 2c. Verify check constraints exist
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'images' 
      AND c.contype = 'c' 
      AND c.conname = 'check_title_not_empty'
  ) INTO v_has_title_check;

  ASSERT v_has_title_check = true,
    'Test 2 Failed: Check constraint check_title_not_empty is missing on public.images.';

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'images' 
      AND c.contype = 'c' 
      AND c.conname = 'check_has_image_source'
  ) INTO v_has_source_check;

  ASSERT v_has_source_check = true,
    'Test 2 Failed: Check constraint check_has_image_source is missing on public.images.';

  RAISE NOTICE '✓ [PASS] Test 2: public.images table structure, 17 column definitions, PK, and check constraints verified (in-memory).';
END $$;

-- ==============================================================================
-- TEST 3 — INDEX INTEGRITY & READINESS
-- ==============================================================================
DO $$
DECLARE
  v_gin_valid boolean;
  v_desc_valid boolean;
BEGIN
  -- Verify idx_images_tags exists, is GIN access method, targets 'tags', and is valid/ready
  SELECT (
    am.amname = 'gin' 
    AND i.indisvalid = true 
    AND i.indisready = true 
    AND a.attname = 'tags'
  ) INTO v_gin_valid
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  JOIN pg_class t ON t.oid = i.indrelid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  JOIN pg_am am ON c.relam = am.oid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
  WHERE n.nspname = 'public' 
    AND t.relname = 'images' 
    AND c.relname = 'idx_images_tags';

  ASSERT v_gin_valid = true,
    'Test 3 Failed: idx_images_tags must be an active, valid GIN index on public.images(tags).';

  -- Verify idx_images_created_at_desc exists, is btree, targets 'created_at', is valid/ready, and uses DESC order
  SELECT (
    am.amname = 'btree' 
    AND i.indisvalid = true 
    AND i.indisready = true 
    AND a.attname = 'created_at'
    AND pg_get_indexdef(c.oid) LIKE '%(created_at DESC)%'
  ) INTO v_desc_valid
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  JOIN pg_class t ON t.oid = i.indrelid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  JOIN pg_am am ON c.relam = am.oid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
  WHERE n.nspname = 'public' 
    AND t.relname = 'images' 
    AND c.relname = 'idx_images_created_at_desc';

  ASSERT v_desc_valid = true,
    'Test 3 Failed: idx_images_created_at_desc must be an active, valid B-tree index on public.images(created_at DESC).';

  RAISE NOTICE '✓ [PASS] Test 3: Indexes idx_images_tags (GIN) and idx_images_created_at_desc (B-tree DESC) are verified valid and ready.';
END $$;

-- ==============================================================================
-- TEST 4 — ROW LEVEL SECURITY ACTIVATION
-- ==============================================================================
DO $$
BEGIN
  ASSERT (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'images' AND relnamespace = 'public'::regnamespace
  ) = true, 'Test 4 Failed: Row Level Security is NOT enabled on public.images.';

  ASSERT (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'admin_users' AND relnamespace = 'public'::regnamespace
  ) = true, 'Test 4 Failed: Row Level Security is NOT enabled on public.admin_users.';

  RAISE NOTICE '✓ [PASS] Test 4: Row Level Security is actively enabled on both public.images and public.admin_users.';
END $$;

-- ==============================================================================
-- TEST 5 — SINGLE ADMINISTRATOR ARCHITECTURE & CONSTRAINTS
-- ==============================================================================
DO $$
DECLARE
  v_col_valid boolean;
  v_singleton_unique boolean;
  v_singleton_check boolean;
  v_user_fk_valid boolean;
  v_user_unique boolean;
BEGIN
  -- 5a. is_singleton column is boolean, NOT NULL, DEFAULT true
  SELECT (
    udt_name = 'bool' 
    AND is_nullable = 'NO' 
    AND column_default = 'true'
  ) INTO v_col_valid
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'admin_users' 
    AND column_name = 'is_singleton';

  ASSERT v_col_valid = true,
    'Test 5a Failed: admin_users.is_singleton must be boolean, NOT NULL, with default true.';

  -- 5b. UNIQUE constraint applies specifically and solely to is_singleton
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' 
      AND t.relname = 'admin_users' 
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname::text ORDER BY array_position(c.conkey, a.attnum))
        FROM pg_attribute a
        WHERE a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
      ) = ARRAY['is_singleton']::text[]
  ) INTO v_singleton_unique;

  ASSERT v_singleton_unique = true,
    'Test 5b Failed: A dedicated single-column UNIQUE constraint must exist on admin_users(is_singleton).';

  -- 5c. CHECK constraint explicitly enforces (is_singleton IS TRUE)
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' 
      AND t.relname = 'admin_users' 
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%is_singleton IS TRUE%'
  ) INTO v_singleton_check;

  ASSERT v_singleton_check = true,
    'Test 5c Failed: CHECK constraint enforcing (is_singleton IS TRUE) on admin_users is missing.';

  -- 5d. Foreign Key references auth.users(id) with ON DELETE CASCADE
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_class ref_t ON c.confrelid = ref_t.oid
    JOIN pg_namespace ref_n ON ref_t.relnamespace = ref_n.oid
    WHERE n.nspname = 'public' 
      AND t.relname = 'admin_users' 
      AND c.contype = 'f'
      AND ref_n.nspname = 'auth'
      AND ref_t.relname = 'users'
      AND c.confdeltype = 'c' -- 'c' = CASCADE
      AND (
        SELECT array_agg(a.attname::text ORDER BY array_position(c.conkey, a.attnum))
        FROM pg_attribute a
        WHERE a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
      ) = ARRAY['user_id']::text[]
      AND (
        SELECT array_agg(ref_a.attname::text ORDER BY array_position(c.confkey, ref_a.attnum))
        FROM pg_attribute ref_a
        WHERE ref_a.attrelid = ref_t.oid AND ref_a.attnum = ANY(c.confkey)
      ) = ARRAY['id']::text[]
  ) INTO v_user_fk_valid;

  ASSERT v_user_fk_valid = true,
    'Test 5d Failed: Foreign key constraint on admin_users(user_id) -> auth.users(id) ON DELETE CASCADE is missing or misconfigured.';

  -- 5e. UNIQUE constraint on user_id (unique_admin_user)
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' 
      AND t.relname = 'admin_users' 
      AND c.contype = 'u'
      AND c.conname = 'unique_admin_user'
  ) INTO v_user_unique;

  ASSERT v_user_unique = true,
    'Test 5e Failed: UNIQUE constraint unique_admin_user on admin_users(user_id) is missing.';

  RAISE NOTICE '✓ [PASS] Test 5: Single administrator architecture verified (singleton UNIQUE + CHECK IS TRUE, FK cascade to auth.users(id)).';
END $$;

-- ==============================================================================
-- TEST 6 — STORAGE BUCKET CONFIGURATION
-- ==============================================================================
DO $$
DECLARE
  v_bucket record;
  v_expected_mimes text[] := ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
BEGIN
  SELECT * INTO v_bucket FROM storage.buckets WHERE id = 'visual-brain-images';

  ASSERT v_bucket.id IS NOT NULL, 
    'Test 6 Failed: visual-brain-images bucket does not exist in storage.buckets.';

  ASSERT v_bucket.public = true, 
    'Test 6 Failed: visual-brain-images bucket must be public for visual asset delivery.';

  ASSERT v_bucket.file_size_limit = 10485760, 
    format('Test 6 Failed: File size limit must be exactly 10MB (10485760 bytes), found %s.', v_bucket.file_size_limit);

  ASSERT v_bucket.allowed_mime_types @> v_expected_mimes AND v_expected_mimes @> v_bucket.allowed_mime_types,
    format('Test 6 Failed: Allowed MIME types mismatch. Found: %s, Expected: %s.', 
      v_bucket.allowed_mime_types, v_expected_mimes);

  RAISE NOTICE '✓ [PASS] Test 6: Storage bucket "visual-brain-images" verified (public, 10MB limit, 4 raster MIME types).';
END $$;

-- ==============================================================================
-- TEST 7 — IMAGES RLS POLICY DEFINITIONS & ROLE SPECIFICATIONS
-- ==============================================================================
DO $$
DECLARE
  v_total_policies integer;
  v_pol record;
BEGIN
  -- Exactly 4 policies must exist on public.images
  SELECT count(*) INTO v_total_policies 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'images';

  ASSERT v_total_policies = 4,
    format('Test 7 Failed: Expected exactly 4 policies on public.images, found %s.', v_total_policies);

  -- 7a. "Allow public read access to images"
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'Allow public read access to images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 7a Failed: Policy "Allow public read access to images" is missing.';
  ASSERT v_pol.cmd = 'SELECT', format('Test 7a Failed: Command must be SELECT, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['anon', 'authenticated']::name[],
    format('Test 7a Failed: Roles must be strictly [anon, authenticated]. Found: %s.', v_pol.roles);
  ASSERT v_pol.qual = 'true', format('Test 7a Failed: USING expression must be ''true'', got %s.', v_pol.qual);
  ASSERT v_pol.with_check IS NULL, 'Test 7a Failed: WITH CHECK must be NULL on SELECT policy.';

  -- 7b. "Allow admin to insert images"
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'Allow admin to insert images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 7b Failed: Policy "Allow admin to insert images" is missing.';
  ASSERT v_pol.cmd = 'INSERT', format('Test 7b Failed: Command must be INSERT, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['authenticated']::name[],
    format('Test 7b Failed: Roles must be strictly [authenticated]. Found: %s.', v_pol.roles);
  ASSERT v_pol.with_check LIKE '%is_admin()%',
    format('Test 7b Failed: WITH CHECK must invoke public.is_admin(), got %s.', v_pol.with_check);
  ASSERT v_pol.qual IS NULL, 'Test 7b Failed: USING expression must be NULL on INSERT policy.';

  -- 7c. "Allow admin to update images"
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'Allow admin to update images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 7c Failed: Policy "Allow admin to update images" is missing.';
  ASSERT v_pol.cmd = 'UPDATE', format('Test 7c Failed: Command must be UPDATE, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['authenticated']::name[],
    format('Test 7c Failed: Roles must be strictly [authenticated]. Found: %s.', v_pol.roles);
  ASSERT v_pol.qual LIKE '%is_admin()%',
    format('Test 7c Failed: USING must invoke public.is_admin(), got %s.', v_pol.qual);
  ASSERT v_pol.with_check LIKE '%is_admin()%',
    format('Test 7c Failed: WITH CHECK must invoke public.is_admin(), got %s.', v_pol.with_check);

  -- 7d. "Allow admin to delete images"
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'Allow admin to delete images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 7d Failed: Policy "Allow admin to delete images" is missing.';
  ASSERT v_pol.cmd = 'DELETE', format('Test 7d Failed: Command must be DELETE, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['authenticated']::name[],
    format('Test 7d Failed: Roles must be strictly [authenticated]. Found: %s.', v_pol.roles);
  ASSERT v_pol.qual LIKE '%is_admin()%',
    format('Test 7d Failed: USING must invoke public.is_admin(), got %s.', v_pol.qual);
  ASSERT v_pol.with_check IS NULL, 'Test 7d Failed: WITH CHECK must be NULL on DELETE policy.';

  RAISE NOTICE '✓ [PASS] Test 7: public.images RLS policies strictly verified (exact commands, roles, USING & WITH CHECK).';
END $$;

-- ==============================================================================
-- TEST 8 — ADMIN USERS PROTECTION & ACCESS GRANTS
-- ==============================================================================
DO $$
DECLARE
  v_total_policies integer;
  v_pol record;
  v_public_table_acl_count integer;
BEGIN
  -- Exactly 1 policy must exist on public.admin_users (SELECT only)
  SELECT count(*) INTO v_total_policies 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'admin_users';

  ASSERT v_total_policies = 1,
    format('Test 8 Failed: Expected exactly 1 policy on public.admin_users, found %s.', v_total_policies);

  -- 8a. Verify "Allow admin to view own admin record"
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Allow admin to view own admin record';

  ASSERT v_pol.policyname IS NOT NULL,
    'Test 8a Failed: Policy "Allow admin to view own admin record" is missing.';
  ASSERT v_pol.cmd = 'SELECT', format('Test 8a Failed: Command must be SELECT, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['authenticated']::name[],
    format('Test 8a Failed: Roles must be strictly [authenticated]. Found: %s.', v_pol.roles);
  ASSERT v_pol.qual LIKE '%user_id = auth.uid()%' AND v_pol.qual LIKE '%is_admin()%',
    format('Test 8a Failed: USING must enforce user_id = auth.uid() AND is_admin(). Got: %s.', v_pol.qual);
  ASSERT v_pol.with_check IS NULL, 'Test 8a Failed: WITH CHECK must be NULL on SELECT policy.';

  -- 8b. Verify NO mutation policies exist (INSERT, UPDATE, DELETE, ALL)
  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_users' AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ), 'Test 8b Failed: Dangerous mutation policies exist on public.admin_users!';

  -- 8c. Verify role privileges on public.admin_users
  -- anon role must have zero privileges:
  ASSERT NOT has_table_privilege('anon', 'public.admin_users', 'SELECT'),
    'Test 8c Failed: anon must NOT have SELECT on public.admin_users.';
  ASSERT NOT has_table_privilege('anon', 'public.admin_users', 'INSERT'),
    'Test 8c Failed: anon must NOT have INSERT on public.admin_users.';
  ASSERT NOT has_table_privilege('anon', 'public.admin_users', 'UPDATE'),
    'Test 8c Failed: anon must NOT have UPDATE on public.admin_users.';
  ASSERT NOT has_table_privilege('anon', 'public.admin_users', 'DELETE'),
    'Test 8c Failed: anon must NOT have DELETE on public.admin_users.';

  -- Verify PUBLIC pseudo-role has no privileges in PostgreSQL relacl (grantee = 0 in aclexplode)
  -- Uses COALESCE with acldefault('r', c.relowner) to ensure default privileges are evaluated if relacl is NULL
  SELECT count(*) INTO v_public_table_acl_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
  WHERE n.nspname = 'public' 
    AND c.relname = 'admin_users'
    AND a.grantee = 0;

  ASSERT v_public_table_acl_count = 0,
    format('Test 8c Failed: PUBLIC pseudo-role has %s privilege entry/entries on public.admin_users in relacl.', v_public_table_acl_count);

  RAISE NOTICE '✓ [PASS] Test 8: public.admin_users protection verified (anon/PUBLIC blocked via ACL, admin self-SELECT, zero mutation policies).';
END $$;

-- ==============================================================================
-- TEST 9 — STORAGE RLS POLICY DEFINITIONS & BUCKET ISOLATION
-- ==============================================================================
DO $$
DECLARE
  v_bucket_id text := 'visual-brain-images';
  v_total_vb_policies integer;
  v_pol record;
  v_qual text;
  v_check text;
  v_targets_vb boolean;
  v_extracted_bucket text;
BEGIN
  -- 9a. Verify exactly 4 policies exist targeting visual-brain-images
  SELECT count(*) INTO v_total_vb_policies 
  FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND (qual LIKE '%visual-brain-images%' OR with_check LIKE '%visual-brain-images%');

  ASSERT v_total_vb_policies = 4,
    format('Test 9a Failed: Expected exactly 4 storage policies referencing visual-brain-images, found %s.', v_total_vb_policies);

  -- 9b. Semantic audit across ALL write policies on storage.objects.
  -- Permissive policies in PostgreSQL combine using logical OR across policies for the same role and action.
  -- Any write policy on storage.objects that could permit writes to visual-brain-images must be
  -- proven to enforce:
  --   1. Proven bucket isolation: strict equality to 'visual-brain-images' (or demonstrably isolating to another bucket).
  --   2. Proven admin authorization: public.is_admin() invocation on any policy affecting visual-brain-images.
  --   3. Proven role restriction: authenticated role only (never anon or public) for visual-brain-images writes.
  --   4. Proven conjunctive logic: zero OR disjunctions that could bypass bucket checks or admin checks.
  --
  -- CONSERVATIVE FAIL-CLOSED ISOLATION PRINCIPLE:
  -- Mere presence of "bucket_id" in an expression does NOT prove isolation (e.g. "bucket_id IS NOT NULL",
  -- "!=", or "bucket_id = 'other' OR true" would leave visual-brain-images vulnerable).
  -- Catalog inspection proves isolation if and only if:
  --   - The clause explicitly enforces equality to a single specific bucket: bucket_id = '<bucket_name>'
  --   - The clause contains NO disjunctions (OR) that could permit alternative evaluation paths.
  -- Any write policy on storage.objects whose conditions cannot be deterministically proven to exclude
  -- visual-brain-images fails closed and raises an exception.
  FOR v_pol IN
    SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    v_qual := COALESCE(v_pol.qual, '');
    v_check := COALESCE(v_pol.with_check, '');
    v_targets_vb := (v_qual LIKE '%visual-brain-images%' OR v_check LIKE '%visual-brain-images%');

    IF v_targets_vb THEN
      -- ========================================================================
      -- SCENARIO A: Policy targets visual-brain-images
      -- ========================================================================

      -- 1. Role restriction: must be strictly [authenticated] (never anon or public)
      IF ('anon' = ANY(v_pol.roles) OR 'public' = ANY(v_pol.roles) OR NOT (v_pol.roles = ARRAY['authenticated']::name[])) THEN
        RAISE EXCEPTION 'Test 9b Security Failure: Write policy "%" on storage.objects grants write access on visual-brain-images to unapproved roles (roles: %). Must be strictly [authenticated].',
          v_pol.policyname, v_pol.roles;
      END IF;

      -- 2. Conjunction check: disjunctions (OR) are forbidden as they could bypass bucket restriction or admin check
      IF (v_qual ~* '\yOR\y' OR v_check ~* '\yOR\y') THEN
        RAISE EXCEPTION 'Test 9b Security Failure: Write policy "%" (cmd: %) uses disjunction (OR) which could allow bypassing bucket restriction or admin authorization. qual: %, with_check: %',
          v_pol.policyname, v_pol.cmd, v_qual, v_check;
      END IF;

      -- 3. Strict bucket equality & admin authorization based on command type
      IF v_pol.cmd = 'INSERT' THEN
        v_extracted_bucket := substring(v_check from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
        IF v_extracted_bucket IS NULL THEN
          v_extracted_bucket := substring(v_check from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
        END IF;

        IF v_extracted_bucket IS DISTINCT FROM 'visual-brain-images' THEN
          RAISE EXCEPTION 'Test 9b Security Failure: INSERT policy "%" fails to strictly enforce bucket_id = ''visual-brain-images''! with_check: %',
            v_pol.policyname, v_check;
        END IF;

        IF v_check NOT LIKE '%is_admin()%' THEN
          RAISE EXCEPTION 'Test 9b Security Failure: INSERT policy "%" fails to enforce public.is_admin()! with_check: %',
            v_pol.policyname, v_check;
        END IF;

      ELSIF v_pol.cmd = 'DELETE' THEN
        v_extracted_bucket := substring(v_qual from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
        IF v_extracted_bucket IS NULL THEN
          v_extracted_bucket := substring(v_qual from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
        END IF;

        IF v_extracted_bucket IS DISTINCT FROM 'visual-brain-images' THEN
          RAISE EXCEPTION 'Test 9b Security Failure: DELETE policy "%" fails to strictly enforce bucket_id = ''visual-brain-images''! qual: %',
            v_pol.policyname, v_qual;
        END IF;

        IF v_qual NOT LIKE '%is_admin()%' THEN
          RAISE EXCEPTION 'Test 9b Security Failure: DELETE policy "%" fails to enforce public.is_admin()! qual: %',
            v_pol.policyname, v_qual;
        END IF;

      ELSIF v_pol.cmd IN ('UPDATE', 'ALL') THEN
        -- Verify USING clause (determines which rows can be updated/deleted)
        v_extracted_bucket := substring(v_qual from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
        IF v_extracted_bucket IS NULL THEN
          v_extracted_bucket := substring(v_qual from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
        END IF;

        IF v_extracted_bucket IS DISTINCT FROM 'visual-brain-images' THEN
          RAISE EXCEPTION 'Test 9b Security Failure: % policy "%" USING clause fails to strictly enforce bucket_id = ''visual-brain-images''! qual: %',
            v_pol.cmd, v_pol.policyname, v_qual;
        END IF;

        IF v_qual NOT LIKE '%is_admin()%' THEN
          RAISE EXCEPTION 'Test 9b Security Failure: % policy "%" USING clause fails to enforce public.is_admin()! qual: %',
            v_pol.cmd, v_pol.policyname, v_qual;
        END IF;

        -- Verify WITH CHECK clause (determines new row contents, if specified)
        IF v_check != '' THEN
          v_extracted_bucket := substring(v_check from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
          IF v_extracted_bucket IS NULL THEN
            v_extracted_bucket := substring(v_check from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
          END IF;

          IF v_extracted_bucket IS DISTINCT FROM 'visual-brain-images' THEN
            RAISE EXCEPTION 'Test 9b Security Failure: % policy "%" WITH CHECK clause fails to strictly enforce bucket_id = ''visual-brain-images''! with_check: %',
              v_pol.cmd, v_pol.policyname, v_check;
          END IF;

          IF v_check NOT LIKE '%is_admin()%' THEN
            RAISE EXCEPTION 'Test 9b Security Failure: % policy "%" WITH CHECK clause fails to enforce public.is_admin()! with_check: %',
              v_pol.cmd, v_pol.policyname, v_check;
          END IF;
        END IF;

      END IF;

    ELSE
      -- ========================================================================
      -- SCENARIO B: Policy does NOT reference visual-brain-images (Unrelated or Broad)
      -- FAIL-CLOSED PRINCIPLE: Must demonstrably exclude visual-brain-images!
      -- ========================================================================

      -- 1. Any OR disjunction prevents proving exclusion through catalog inspection alone
      IF (v_qual ~* '\yOR\y' OR v_check ~* '\yOR\y') THEN
        RAISE EXCEPTION 'Test 9b Security Failure (Fail-Closed): Unrelated write policy "%" (cmd: %) on storage.objects contains OR disjunctions; cannot prove exclusion of visual-brain-images from catalog inspection. qual: %, with_check: %',
          v_pol.policyname, v_pol.cmd, v_qual, v_check;
      END IF;

      -- 2. Verify demonstrable exclusion for active clauses
      IF v_pol.cmd = 'INSERT' THEN
        v_extracted_bucket := substring(v_check from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
        IF v_extracted_bucket IS NULL THEN
          v_extracted_bucket := substring(v_check from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
        END IF;

        IF v_extracted_bucket IS NULL OR v_extracted_bucket = 'visual-brain-images' THEN
          RAISE EXCEPTION 'Test 9b Security Failure (Fail-Closed): INSERT policy "%" lacks provable bucket isolation to an unrelated bucket; could leak write access into visual-brain-images. with_check: %',
            v_pol.policyname, v_check;
        END IF;

      ELSIF v_pol.cmd = 'DELETE' THEN
        v_extracted_bucket := substring(v_qual from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
        IF v_extracted_bucket IS NULL THEN
          v_extracted_bucket := substring(v_qual from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
        END IF;

        IF v_extracted_bucket IS NULL OR v_extracted_bucket = 'visual-brain-images' THEN
          RAISE EXCEPTION 'Test 9b Security Failure (Fail-Closed): DELETE policy "%" lacks provable bucket isolation to an unrelated bucket; could leak delete access into visual-brain-images. qual: %',
            v_pol.policyname, v_qual;
        END IF;

      ELSIF v_pol.cmd IN ('UPDATE', 'ALL') THEN
        -- USING clause check
        v_extracted_bucket := substring(v_qual from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
        IF v_extracted_bucket IS NULL THEN
          v_extracted_bucket := substring(v_qual from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
        END IF;

        IF v_extracted_bucket IS NULL OR v_extracted_bucket = 'visual-brain-images' THEN
          RAISE EXCEPTION 'Test 9b Security Failure (Fail-Closed): % policy "%" USING clause lacks provable bucket isolation to an unrelated bucket. qual: %',
            v_pol.cmd, v_pol.policyname, v_qual;
        END IF;

        -- WITH CHECK clause check (if specified)
        IF v_check != '' THEN
          v_extracted_bucket := substring(v_check from '(?i)(?:^|[^a-zA-Z0-9_!<>])(?:objects\.)?bucket_id\)?(?:::text)?\s*=\s*''([^'']+)''');
          IF v_extracted_bucket IS NULL THEN
            v_extracted_bucket := substring(v_check from '(?i)''([^'']+)''(?:::text)?\s*=\s*\(?(?:objects\.)?bucket_id');
          END IF;

          IF v_extracted_bucket IS NULL OR v_extracted_bucket = 'visual-brain-images' THEN
            RAISE EXCEPTION 'Test 9b Security Failure (Fail-Closed): % policy "%" WITH CHECK clause lacks provable bucket isolation to an unrelated bucket. with_check: %',
              v_pol.cmd, v_pol.policyname, v_check;
          END IF;
        END IF;

      END IF;

    END IF;
  END LOOP;

  -- 9c. Detailed specification inspection of the 4 approved visual-brain-images policies:

  -- 1) Public Read Policy
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Allow public read access to visual-brain-images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 9c Failed: Public read storage policy is missing.';
  ASSERT v_pol.cmd = 'SELECT', format('Test 9c Failed: Command must be SELECT, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['anon', 'authenticated']::name[],
    format('Test 9c Failed: Roles must be strictly [anon, authenticated]. Found: %s.', v_pol.roles);
  ASSERT (v_pol.qual ~* '(^|[^a-zA-Z0-9_!<>])(objects\.)?bucket_id\)?(::text)?\s*=\s*''visual-brain-images''' OR v_pol.qual ~* '''visual-brain-images''(::text)?\s*=\s*\(?(objects\.)?bucket_id')
     AND v_pol.qual !~* '\yOR\y',
    format('Test 9c Failed: USING expression must strictly enforce bucket_id = ''visual-brain-images'' without OR. Got: %s.', v_pol.qual);
  ASSERT v_pol.with_check IS NULL, 'Test 9c Failed: WITH CHECK must be NULL on SELECT storage policy.';

  -- 2) Admin Upload Policy
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Allow admin upload to visual-brain-images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 9c Failed: Admin upload storage policy is missing.';
  ASSERT v_pol.cmd = 'INSERT', format('Test 9c Failed: Command must be INSERT, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['authenticated']::name[],
    format('Test 9c Failed: Roles must be strictly [authenticated]. Found: %s.', v_pol.roles);
  ASSERT (v_pol.with_check ~* '(^|[^a-zA-Z0-9_!<>])(objects\.)?bucket_id\)?(::text)?\s*=\s*''visual-brain-images''' OR v_pol.with_check ~* '''visual-brain-images''(::text)?\s*=\s*\(?(objects\.)?bucket_id')
     AND v_pol.with_check LIKE '%is_admin()%'
     AND v_pol.with_check !~* '\yOR\y',
    format('Test 9c Failed: WITH CHECK must enforce bucket_id = ''visual-brain-images'' AND is_admin() without OR. Got: %s.', v_pol.with_check);
  ASSERT v_pol.qual IS NULL, 'Test 9c Failed: USING expression must be NULL on INSERT storage policy.';

  -- 3) Admin Update Policy
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Allow admin update to visual-brain-images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 9c Failed: Admin update storage policy is missing.';
  ASSERT v_pol.cmd = 'UPDATE', format('Test 9c Failed: Command must be UPDATE, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['authenticated']::name[],
    format('Test 9c Failed: Roles must be strictly [authenticated]. Found: %s.', v_pol.roles);
  ASSERT (v_pol.qual ~* '(^|[^a-zA-Z0-9_!<>])(objects\.)?bucket_id\)?(::text)?\s*=\s*''visual-brain-images''' OR v_pol.qual ~* '''visual-brain-images''(::text)?\s*=\s*\(?(objects\.)?bucket_id')
     AND v_pol.qual LIKE '%is_admin()%'
     AND v_pol.qual !~* '\yOR\y',
    format('Test 9c Failed: USING must enforce bucket_id = ''visual-brain-images'' AND is_admin() without OR. Got: %s.', v_pol.qual);
  ASSERT (v_pol.with_check ~* '(^|[^a-zA-Z0-9_!<>])(objects\.)?bucket_id\)?(::text)?\s*=\s*''visual-brain-images''' OR v_pol.with_check ~* '''visual-brain-images''(::text)?\s*=\s*\(?(objects\.)?bucket_id')
     AND v_pol.with_check LIKE '%is_admin()%'
     AND v_pol.with_check !~* '\yOR\y',
    format('Test 9c Failed: WITH CHECK must enforce bucket_id = ''visual-brain-images'' AND is_admin() without OR. Got: %s.', v_pol.with_check);

  -- 4) Admin Delete Policy
  SELECT * INTO v_pol FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Allow admin delete from visual-brain-images';

  ASSERT v_pol.policyname IS NOT NULL, 'Test 9c Failed: Admin delete storage policy is missing.';
  ASSERT v_pol.cmd = 'DELETE', format('Test 9c Failed: Command must be DELETE, got %s.', v_pol.cmd);
  ASSERT (SELECT array_agg(r ORDER BY r) FROM unnest(v_pol.roles) r) = ARRAY['authenticated']::name[],
    format('Test 9c Failed: Roles must be strictly [authenticated]. Found: %s.', v_pol.roles);
  ASSERT (v_pol.qual ~* '(^|[^a-zA-Z0-9_!<>])(objects\.)?bucket_id\)?(::text)?\s*=\s*''visual-brain-images''' OR v_pol.qual ~* '''visual-brain-images''(::text)?\s*=\s*\(?(objects\.)?bucket_id')
     AND v_pol.qual LIKE '%is_admin()%'
     AND v_pol.qual !~* '\yOR\y',
    format('Test 9c Failed: USING must enforce bucket_id = ''visual-brain-images'' AND is_admin() without OR. Got: %s.', v_pol.qual);
  ASSERT v_pol.with_check IS NULL, 'Test 9c Failed: WITH CHECK must be NULL on DELETE storage policy.';

  RAISE NOTICE '✓ [PASS] Test 9: storage.objects RLS verified (fail-closed isolation, zero broad write policies, public read, admin upload/update/delete).';
END $$;

-- ==============================================================================
-- TEST 10 — is_admin() FUNCTION PRIVILEGES & SECURITY CONFIGURATION
-- ==============================================================================
DO $$
DECLARE
  v_proc record;
  v_public_fn_acl_count integer;
BEGIN
  -- 10a. Verify anon role cannot execute public.is_admin()
  ASSERT NOT has_function_privilege('anon', 'public.is_admin()', 'EXECUTE'),
    'Test 10a Failed: anon role must NOT have EXECUTE privilege on public.is_admin().';

  -- 10b. Verify authenticated role can execute public.is_admin()
  ASSERT has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE'),
    'Test 10b Failed: authenticated role must have EXECUTE privilege on public.is_admin().';

  -- 10c. Verify PUBLIC pseudo-role has no EXECUTE privilege in PostgreSQL proacl (grantee = 0 in aclexplode)
  -- Uses COALESCE with acldefault('f', p.proowner) to ensure default privileges are evaluated if proacl is NULL
  SELECT count(*) INTO v_public_fn_acl_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
  WHERE n.nspname = 'public' 
    AND p.proname = 'is_admin'
    AND a.grantee = 0
    AND a.privilege_type = 'EXECUTE';

  ASSERT v_public_fn_acl_count = 0,
    format('Test 10c Failed: Effective PUBLIC privileges allow EXECUTE on public.is_admin() in proacl (found %s entries).', v_public_fn_acl_count);

  -- 10d. Verify function attributes: SECURITY DEFINER, STABLE, and search_path = public
  SELECT prosecdef, provolatile, proconfig INTO v_proc
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'is_admin';

  ASSERT v_proc.prosecdef = true,
    'Test 10d Failed: public.is_admin() must be defined as SECURITY DEFINER.';
  ASSERT v_proc.provolatile = 's', -- 's' = STABLE
    'Test 10d Failed: public.is_admin() must be marked STABLE.';
  ASSERT v_proc.proconfig @> ARRAY['search_path=public'],
    format('Test 10d Failed: public.is_admin() must lock search_path to public. Found: %s.', v_proc.proconfig);

  RAISE NOTICE '✓ [PASS] Test 10: public.is_admin() security attributes verified (SECURITY DEFINER, STABLE, search_path=public, execute restricted to authenticated, PUBLIC revoked via ACL).';
END $$;
