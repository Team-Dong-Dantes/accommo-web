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
    path: '/dashboard',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Dashboard.vue'),
        meta: { title: 'Dashboard', subtitle: 'Platform overview — properties, occupancy, students & activity' },
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
        meta: { title: 'Users', subtitle: 'All registered accounts — click any user to see placement, welfare, compliance & more' },
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
        meta: { title: 'Verifications', subtitle: 'Review and approve landlord identities and property OSAS accreditations' },
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
        meta: { title: 'Map View', subtitle: 'Interactive map and directory of all registered boarding houses and dorms' },
      },
    ],
  },
  {
    path: '/property-hub',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/PropertyHub.vue'),
        meta: { title: 'Property Hub', subtitle: 'Audit · Compliance · Accreditation · Performance — all in one place' },
      },
    ],
  },
  {
    path: '/concerns',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Concerns.vue'),
        meta: { title: 'Concerns', subtitle: 'Manage student tickets, landlord issues, and support requests' },
      },
    ],
  },
  {
    path: '/announcements',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Announcements.vue'),
        meta: { title: 'Announcements', subtitle: 'Manage platform announcements, policies, and guidelines' },
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
        meta: { title: 'Audit Logs', subtitle: 'Track system events, user activity, and data modifications' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
]

export default routes
