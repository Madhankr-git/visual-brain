-- ==============================================================================
-- Visual Brain — Milestone 1: Administrator Registration Script
-- File: supabase/scripts/setup_admin.sql
-- Description: Safely associates a Supabase Auth user with public.admin_users.
--
-- INSTRUCTIONS FOR USE:
-- 1. Create the administrator account via Supabase Dashboard:
--    Dashboard -> Authentication -> Users -> "Add User" (or "Invite User").
--    Ensure "Auto Confirm User?" is checked.
-- 2. Open Supabase SQL Editor.
-- 3. Replace 'YOUR_ADMIN_EMAIL_HERE' below with the actual administrator email.
-- 4. Execute this script.
-- ==============================================================================

DO $$
DECLARE
  -- >>> REPLACE THIS VALUE WITH YOUR ACTUAL ADMINISTRATOR EMAIL <<<
  v_admin_email text := 'YOUR_ADMIN_EMAIL_HERE';
  
  v_user_id uuid;
  v_existing_admin_count integer;
BEGIN
  -- 1. Check if an administrator is already registered
  SELECT COUNT(*) INTO v_existing_admin_count FROM public.admin_users;
  IF v_existing_admin_count > 0 THEN
    RAISE NOTICE 'An administrator is already configured in public.admin_users. V1 permits exactly 1 administrator.';
    RETURN;
  END IF;

  -- 2. Locate the user in auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE lower(email) = lower(trim(v_admin_email));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" was not found in auth.users. Please create the user in Supabase Authentication before running this script.', v_admin_email;
  END IF;

  -- 3. Safely insert the admin record
  INSERT INTO public.admin_users (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'SUCCESS: User "%" (UUID: %) has been successfully registered as the sole administrator for Visual Brain.', v_admin_email, v_user_id;
END $$;
