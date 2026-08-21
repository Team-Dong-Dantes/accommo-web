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
    path: '/property-hub',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/PropertyHub.vue'),
        meta: { title: 'Property Hub' },
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
    path: '/concerns',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        component: () => import('@/pages/admin/Concerns.vue'),
        meta: { title: 'Concerns' },
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
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
]

export default routes
