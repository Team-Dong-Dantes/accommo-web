import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/stores/auth';

export default defineRouter(() => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : (import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  });

  let roleFetchInProgress: Promise<string | null> | null = null;

  async function fetchUserRole(session: { user: { id: string } }): Promise<string | null> {
    const authStore = useAuthStore();
    if (authStore.cachedRole) return authStore.cachedRole;

    if (roleFetchInProgress) return roleFetchInProgress;

    roleFetchInProgress = (async () => {
       try {
         const { data, error } = await supabase
           .from('users')
            .select('id, full_name, email, initials, avatar_color, phone, is_superadmin, onboarding_complete, role')
           .eq('id', session.user.id)
           .maybeSingle();

         if (error || !data) return null;

         authStore.user = data as any;
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
      return '/auth/login';
    }

    // Authenticated: load the role/profile so we can check onboarding state.
    const role = await fetchUserRole(session);
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
      return '/';
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
