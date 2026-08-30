import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/LandingPage.vue') },
    ],
  },
  {
    path: '/login',
    redirect: '/auth/login',
  },
  {
    path: '/auth/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/auth/LoginPage.vue') },
    ],
  },
  {
    path: '/onboarding',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', component: () => import('@/pages/auth/OnboardingPage.vue') },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Dashboard.vue'),
        meta: { title: 'Dashboard' },
      },
    ],
  },
  {
    path: '/users',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Users.vue'),
        meta: { title: 'Account Management' },
      },
    ],
  },
  {
    path: '/verifications',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Verifications.vue'),
        meta: { title: 'Verifications' },
      },
    ],
  },
  {
    path: '/map-view',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/MapView.vue'),
        meta: { title: 'Map View' },
      },
    ],
  },
  {
    path: '/accommodation-hub',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/PropertyHub.vue'),
        meta: { title: 'Accommodation Hub' },
      },
    ],
  },
  {
    path: '/room-hub',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/RoomHub.vue'),
        meta: { title: 'Room Hub' },
      },
    ],
  },
  {
    path: '/support-tickets',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/SupportTickets.vue'),
        meta: { title: 'Support Tickets' },
      },
    ],
  },
  {
    path: '/property-hub',
    redirect: (to) => ({ path: '/accommodation-hub', query: to.query, hash: to.hash }),
  },
  {
    path: '/complaints/:id',
    redirect: (to) => ({ path: '/support-tickets', query: { focus: `ticket:${String(to.params.id ?? '')}` } }),
  },
  {
    path: '/concerns',
    redirect: (to) => ({ path: '/support-tickets', query: to.query, hash: to.hash }),
  },
  {
    path: '/announcements',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Announcements.vue'),
        meta: { title: 'Announcements' },
      },
    ],
  },
  {
    path: '/audit-logs',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/AuditLogs.vue'),
        meta: { title: 'Audit Logs' },
      },
    ],
  },
  {
    path: '/settings',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Settings.vue'),
        meta: { title: 'Settings' },
      },
    ],
  },
  {
    path: '/notifications',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Notifications.vue'),
        meta: { title: 'Notifications' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
]

export default routes
