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

interface AppUser {
  id: string;
  full_name: string;
  email: string;
  initials: string;
  avatar_color: string | null;
  phone: string | null;
  is_superadmin: boolean;
  onboarding_complete: boolean;
  role: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    cachedRole: null as string | null,
    user: null as AppUser | null,
  }),
  getters: {
    isSuperadmin: (state) => !!state.user?.is_superadmin,
    needsOnboarding: (state) =>
      !!state.user && state.user.role === 'admin' && !state.user.onboarding_complete,
  },
  actions: {
    async loadProfileById(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, initials, avatar_color, phone, is_superadmin, onboarding_complete, role')
        .eq('id', id)
        .single();

      if (error) throw sanitizeError(error);

      const row = data as unknown as AppUser;
      this.user = row ?? null;
      this.cachedRole = row?.role ?? null;
      return row;
    },

    async login(email: string, password: string) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw sanitizeError(authError);
      if (!authData?.user) throw new Error('Login failed: No user returned.');

      const profile = await this.loadProfileById(authData.user.id);

      if (profile?.role !== 'admin') throw new Error('Access denied: Admins only.');

      return {
        session: authData.session,
        role: profile?.role,
      };
    },

    async logout() {
      await supabase.auth.signOut();
      this.cachedRole = null;
      this.user = null;
    },

    clearCachedRole() {
      this.cachedRole = null;
    },

    async getSessionProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return { session: null, profile: null };

      const profile = await this.loadProfileById(session.user.id).catch(() => null);

      return { session, profile: this.user };
    },

    roleLabel(role: string): string {
      switch (role) {
        case 'admin': return 'Administrator';
        case 'student': return 'Student';
        case 'landlord': return 'Landlord';
        default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
      }
    },
  },
});
