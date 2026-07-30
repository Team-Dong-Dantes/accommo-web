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
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error || !data) return null;

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
    const isAuthenticated = !!session;

    const publicRoutes = ['/', '/auth/login'];
    const isPublicRoute = publicRoutes.includes(to.path);

    if (!isAuthenticated && !isPublicRoute) {
      return '/auth/login';
    }

    if (isAuthenticated && isPublicRoute) {
      const role = await fetchUserRole(session);
      if (role === 'admin') return '/dashboard';
      if (role === 'student') return '/';
      if (role === 'landlord') return '/';
      return '/';
    }

    const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
    if (!requiresAuth) {
      return true;
    }

    if (!isAuthenticated || !session) {
      return '/auth/login';
    }

    const requiredRole = to.matched.find((record) => record.meta?.role)?.meta?.role as string | undefined;

    if (requiredRole) {
      const role = await fetchUserRole(session);
      if (role !== requiredRole) {
        return '/auth/login';
      }
    }

    return true;
  });

  return Router;
});
