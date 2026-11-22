/**
 * Visual Brain — Centralized Authentication Service for Administrator Access
 * File: src/services/auth.js
 * 
 * Powered by Supabase Auth with database-level administrator validation (public.admin_users).
 * Never stores or compares hardcoded passwords.
 */

import { supabase } from './supabase';

export const AuthService = {
  /**
   * Signs in the administrator using Supabase Auth.
   * Verifies that the authenticated user's UUID exists in public.admin_users.
   * 
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, user?: Object, session?: Object, error?: string }>}
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return {
        success: false,
        error: 'Email and password are required.'
      };
    }

    try {
      // 1. Authenticate against Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (authError) {
        return {
          success: false,
          error: authError.message || 'Authentication failed. Please verify credentials.'
        };
      }

      if (!data?.user) {
        return {
          success: false,
          error: 'Authentication failed. No user record returned.'
        };
      }

      // 2. Strict authorization: verify authenticated user's UUID against public.admin_users
      const { data: adminRecord, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id')
        .eq('user_id', data.user.id)
        .single();

      if (adminError || !adminRecord) {
        // Sign out unauthorized user immediately
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Access Denied: This account is not registered as a Visual Brain administrator.'
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (err) {
      console.error('[AuthService:login] Unexpected error:', err);
      return {
        success: false,
        error: err.message || 'An unexpected error occurred during authentication.'
      };
    }
  },

  /**
   * Signs out the administrator from Supabase Auth.
   */
  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthService:logout] Error signing out:', err);
    }
  },

  /**
   * Retrieves current active Supabase Auth session.
   * @returns {Promise<Object|null>}
   */
  async getSession() {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch {
      return null;
    }
  },

  /**
   * Retrieves current authenticated Supabase user.
   * @returns {Promise<Object|null>}
   */
  async getUser() {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch {
      return null;
    }
  },

  /**
   * Checks if an active authenticated session exists for the registered admin.
   * Verifies against public.admin_users.
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return false;

      const { data: adminRecord, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      return Boolean(adminRecord && !error);
    } catch {
      return false;
    }
  },

  /**
   * Subscribes to Supabase Auth state changes.
   * 
   * @param {Function} callback - (event, session) => void
   * @returns {{ data: { subscription: { unsubscribe: Function } } }}
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default AuthService;
