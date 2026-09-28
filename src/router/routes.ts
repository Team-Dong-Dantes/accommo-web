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
    // The second sign-in step, and where the e-mailed reset link lands.
    // Both need a session; the router guard decides which one applies.
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'mfa', component: () => import('@/pages/auth/AuthStepPage.vue') },
      { path: 'reset-password', component: () => import('@/pages/auth/AuthStepPage.vue') },
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
        meta: { title: 'Dashboard', subtitle: 'Housing, verification and support activity at a glance' },
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
        meta: { title: 'Account Management', subtitle: 'Students and landlords/landladies, their accounts and access' },
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
        meta: { title: 'Verifications', subtitle: 'Review requirements and decide on new accounts and accommodations' },
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
        meta: { title: 'Map View', subtitle: 'Every accommodation and where it stands, on the map' },
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
        meta: { title: 'Accommodation Hub', subtitle: 'Accreditation, rooms and ratings for each accommodation' },
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
        meta: { title: 'Room Hub', subtitle: 'Rooms, occupancy and rent across all accommodations' },
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
        meta: { title: 'Support Tickets', subtitle: 'Concerns raised by students and landlords/landladies' },
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
        meta: { title: 'Announcements', subtitle: 'Notices and policies for students and landlords/landladies' },
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
        meta: { title: 'Audit Logs', subtitle: 'Who changed what, and when' },
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
        meta: { title: 'Settings', subtitle: 'Your account, security and console preferences' },
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
        meta: { title: 'Notifications', subtitle: 'Alerts about requests, tickets and accounts' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
]

export default routes
