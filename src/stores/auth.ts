import { defineStore } from 'pinia';
import { supabase } from '@/utils/supabase';
import { roleLabel } from '@/utils/format';
import { NO_ACCESS, PATH_AREAS, SUPERADMIN_PATHS, normalizeLevels, type AccessLevels, type Area } from '@/utils/access';

function sanitizeError(error: unknown): Error {
  const raw = (error as { message?: unknown } | null)?.message;
  // check_session's own message is the one worth showing.
  if (typeof raw === 'string' && raw.includes('admin access has expired')) return new Error(raw);
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

export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  initials: string;
  avatar_color: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_superadmin: boolean;
  onboarding_complete: boolean;
  role: string;
  /** Checked at sign-in and on every navigation — see the router guard. */
  status: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    cachedRole: null as string | null,
    user: null as AppUser | null,
    /** Own admin_access levels; the system admin's are ignored (always edit). */
    access: NO_ACCESS as AccessLevels,
    accessPreset: null as string | null,
    accessExpiresAt: null as string | null,
  }),
  getters: {
    isSuperadmin: (state) => !!state.user?.is_superadmin,
    /** Mirrors can_view()/can_edit(); the database enforces the same rule. */
    can: (state) => (area: Area, level: 'view' | 'edit' = 'view'): boolean => {
      if (state.user?.is_superadmin) return true
      const has = state.access[area]
      return level === 'view' ? has === 'view' || has === 'edit' : has === 'edit'
    },
    /** Whether a console page is open to this admin. */
    canOpen(): (path: string) => boolean {
      return (path: string) => {
        if (this.isSuperadmin) return true
        if (SUPERADMIN_PATHS.has(path)) return false
        const areas = PATH_AREAS[path]
        return !areas || areas.some((a) => this.can(a))
      }
    },
    needsOnboarding: (state) =>
      !!state.user && state.user.role === 'admin' && !state.user.onboarding_complete,
  },
  actions: {
    async loadProfileById(id: string) {
      const { data, error } = await supabase
        .from('users_full')
        .select('id, full_name, email, initials, avatar_color, avatar_url, phone, is_superadmin, onboarding_complete, role, status')
        .eq('id', id)
        .single();

      if (error) throw sanitizeError(error);

      const row = data as unknown as AppUser;
      this.user = row ?? null;
      this.cachedRole = row?.role ?? null;
      await this.loadAccess();
      return row;
    },

    async loadAccess() {
      const id = this.user?.id;
      if (!id || this.user?.is_superadmin) {
        this.access = NO_ACCESS;
        this.accessPreset = null;
        this.accessExpiresAt = null;
        return;
      }
      const { data } = await supabase.from('admin_access').select('preset, levels, expires_at').eq('user_id', id).maybeSingle();
      this.access = normalizeLevels(data?.levels);
      this.accessPreset = data?.preset ?? null;
      this.accessExpiresAt = data?.expires_at ?? null;
    },

    async login(email: string, password: string) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw sanitizeError(authError);
      if (!authData?.user) throw new Error('Login failed: No user returned.');

      // An expired admin gets a session from Auth that the database then refuses;
      // don't leave it behind.
      const profile = await this.loadProfileById(authData.user.id).catch(async (e: unknown) => {
        await this.logout();
        throw e;
      });

      // Sign the rejected session out, or it lingers and the router guard keeps
      // bouncing this browser off the login page.
      if (profile?.role !== 'admin') {
        await this.logout();
        throw new Error('Access denied: Admins only.');
      }

      // A suspended admin was still being let all the way in — the mobile app
      // has refused a suspended account since 20260909000002_auth_status_gate,
      // but nothing on this side ever looked at `status`.
      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        this.user = null;
        this.cachedRole = null;
        throw new Error('This account has been suspended.');
      }

      return {
        session: authData.session,
        role: profile?.role,
      };
    },

    async logout() {
      await supabase.auth.signOut();
      this.cachedRole = null;
      this.user = null;
      this.access = NO_ACCESS;
      this.accessPreset = null;
      this.accessExpiresAt = null;
    },

    clearCachedRole() {
      this.cachedRole = null;
    },

    /**
     * Attach a Google account to the admin who is already signed in.
     *
     * `linkIdentity` rather than `signInWithOAuth`: the invite link has already
     * established the session, so Google binds to *that* user. OAuth sign-in
     * would match by email instead, and Supabase refuses to auto-link against
     * an unverified address (pre-account-takeover protection) — a pending
     * invitee would have ended up with a second, separate account.
     *
     * `login_hint` names the address the invite was sent to, so Google goes
     * straight to that account instead of asking which one. Without it Google
     * falls back to its own default and shows the account chooser whenever more
     * than one account is signed in — the invited admin should not have to pick
     * their own address out of a list. It is a hint, not a constraint: they can
     * still switch accounts on Google's side if they want to.
     *
     * Needs "Allow manual linking" on under Authentication -> Sign In /
     * Providers, and the return URL on the Redirect URLs allow list. This
     * navigates away; nothing after it runs.
     */
    async connectGoogle(email: string) {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
          queryParams: { login_hint: email },
        },
      });
      if (error) throw sanitizeError(error);
    },

    /**
     * Copy the linked Google account's name and photo onto the users row.
     * Returns the Google name so the caller can prefill its form, or null when
     * no Google identity is attached.
     *
     * Reads `identity_data` rather than `user_metadata`: a link does not
     * reliably refresh the metadata blob. (accommo-mobile reads metadata for
     * its drawer avatar, but that is a sign-in flow, not a link.)
     *
     * Overwrites unconditionally — accommo-web has no avatar upload for admins,
     * so Google is the only source and there is nothing to preserve.
     */
    async syncGoogleProfile(): Promise<string | null> {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) throw sanitizeError(error);

      const google = data?.identities?.find((i) => i.provider === 'google');
      if (!google) return null;

      const identity = google.identity_data ?? {};
      const name = typeof identity.name === 'string' ? identity.name.trim() : '';
      const picture = typeof identity.picture === 'string' ? identity.picture : '';
      if (!name && !picture) return null;

      const patch: { full_name?: string; initials?: string; avatar_url?: string } = {};
      if (name) {
        patch.full_name = name;
        patch.initials = name
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
      }
      if (picture) patch.avatar_url = picture;

      const { error: updateError } = await supabase
        .from('users')
        .update(patch)
        .eq('id', google.user_id);
      if (updateError) throw sanitizeError(updateError);

      await this.loadProfileById(google.user_id);
      return name || null;
    },

    async getSessionProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return { session: null, profile: null };

      await this.loadProfileById(session.user.id).catch(() => null);

      return { session, profile: this.user };
    },

    roleLabel(role: string): string {
      return roleLabel(role);
    },
  },
});
