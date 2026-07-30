import { defineStore } from 'pinia';
import { supabase } from '@/utils/supabase';

function sanitizeError(error: unknown): Error {
  if (error instanceof Error) {
    if (
      error.message.includes('23505') ||
      error.message.includes('duplicate key')
    ) {
      return new Error('A record with this information already exists.');
    }
    if (error.message.includes('PGRST116') || error.message.includes('0 rows')) {
      return new Error('Operation failed due to a database conflict. Please try again.');
    }
    if (error.message.includes('Invalid login credentials')) {
      return new Error('Invalid email or password.');
    }
    if (error.message.includes('Email not confirmed')) {
      return new Error('Please confirm your email address before signing in.');
    }
    if (error.message.includes('rate limit')) {
      return new Error('Too many attempts. Please try again later.');
    }
    return new Error('An unexpected error occurred. Please try again.');
  }
  return new Error('An unexpected error occurred. Please try again.');
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    cachedRole: null as string | null,
  }),
  actions: {
    async login(email: string, password: string) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw sanitizeError(authError);
      if (!authData?.user) throw new Error('Login failed: No user returned.');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw sanitizeError(userError);
      if (userData?.role !== 'admin') throw new Error('Access denied: Admins only.');

      this.cachedRole = userData?.role ?? null;

      return {
        session: authData.session,
        role: userData?.role,
      };
    },

    async logout() {
      await supabase.auth.signOut();
      this.cachedRole = null;
    },

    clearCachedRole() {
      this.cachedRole = null;
    },

    async getSessionProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return { session: null, profile: null };

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      this.cachedRole = profile?.role ?? null;

      return { session, profile };
    },
  },
});
