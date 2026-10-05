import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { supabase } from '@/utils/supabase';
import { markActive } from '@/utils/activity';
import { useAuthStore, type AppUser } from '@/stores/auth';

export default defineRouter(() => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : (import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    // Safari reports a same-page anchor (#download on the landing page) as a
    // navigation, so always returning top:0 left it stuck at the top. 72 is the
    // fixed navbar, matching the landing page's scroll-margin-top.
    scrollBehavior: (to) =>
      to.hash ? { el: to.hash, top: 72, behavior: 'smooth' } : { left: 0, top: 0 },
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  });

  let roleFetchInProgress: Promise<string | null> | null = null;

  // Deliberately NOT cached across navigations. `status` has to be re-read, or a
  // session minted before a suspension keeps the run of the admin console until
  // its token expires. The in-flight promise still collapses the redirect chain
  // of a single navigation into one query.
  async function fetchUserRole(session: { user: { id: string } }): Promise<string | null> {
    const authStore = useAuthStore();
    if (roleFetchInProgress) return roleFetchInProgress;

    roleFetchInProgress = (async () => {
       try {
         const { data, error } = await supabase
           .from('users_full')
            .select('id, full_name, email, initials, avatar_color, phone, is_superadmin, onboarding_complete, role, status')
           .eq('id', session.user.id)
           .maybeSingle();

         if (error || !data) return null;

         authStore.user = data as unknown as AppUser;
         authStore.cachedRole = data.role;
         return data.role;
       } catch {
        return null;
      } finally {
        roleFetchInProgress = null;
      }
    })();

    return roleFetchInProgress;
  }

  Router.beforeEach(async (to) => {
    const { data: { session } } = await supabase.auth.getSession();
    const authStore = useAuthStore();
    const isAuthenticated = !!session;

    const publicRoutes = ['/', '/auth/login'];
    const isPublicRoute = publicRoutes.includes(to.path);
    const isOnboarding = to.path === '/onboarding';

    // Unauthenticated users may only reach public routes.
    if (!isAuthenticated) {
      if (isPublicRoute) return true;
      // A reset link that has expired or was already used arrives with no session.
      if (to.path === '/auth/reset-password') return '/auth/login?reset=expired';
      return '/auth/login';
    }

    // Authenticated: load the role/profile so we can check onboarding state.
    const role = await fetchUserRole(session);

    // Suspension has to bite on every navigation, not just at sign-in — an admin
    // suspended mid-session would otherwise keep working until their token ran
    // out. Mirrors the same check in accommo-mobile/src/router/index.ts.
    if (authStore.user?.status === 'suspended') {
      await supabase.auth.signOut();
      authStore.user = null;
      authStore.clearCachedRole();
      return '/auth/login?suspended=true';
    }

    // Opening the console counts as being active ("Last active" on Users).
    markActive();

    // Second factor before anything else an admin can reach. The database
    // enforces the same rule (is_admin() needs aal2 once a factor exists), so
    // this is about sending them to the code screen, not about security.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsCode = aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
    if (to.path === '/auth/mfa') return needsCode ? true : '/dashboard';
    if (needsCode) return '/auth/mfa';

    // The e-mailed reset link signs the person in, then lands here.
    if (to.path === '/auth/reset-password') return true;

    const needsOnboarding =
      !!authStore.user &&
      authStore.user.role === 'admin' &&
      !authStore.user.onboarding_complete;

    // The onboarding screen is only for admins who haven't completed it yet.
    if (isOnboarding) {
      return needsOnboarding ? true : '/dashboard';
    }

    if (needsOnboarding) {
      return '/onboarding';
    }

    if (isPublicRoute) {
      if (role === 'admin') return '/dashboard';
      // A non-admin session is useless in the console; drop it so the login
      // page can be reached with an admin account.
      if (to.path === '/auth/login') {
        await authStore.logout();
        return true;
      }
      // Non-admins (or a failed role read) stay on the landing page. Returning
      // '/' while already on '/' loops the guard forever.
      return to.path === '/' ? true : '/';
    }

    const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
    if (!requiresAuth) {
      return true;
    }

    const requiredRole = to.matched.find((record) => record.meta?.role)?.meta?.role as string | undefined;

    if (requiredRole && role !== requiredRole) {
      return '/auth/login';
    }

    return true;
  });

  return Router;
});
