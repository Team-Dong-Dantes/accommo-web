export interface NavLeaf {
  id: string;
  label: string;
  icon: string;
  to: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  children: NavLeaf[];
}

export const dashboardLeaf: NavLeaf = {
  id: 'dashboard',
  label: 'Dashboard',
  icon: 'mdi:view-dashboard-outline',
  to: '/dashboard',
};

export const navGroups: NavGroup[] = [
  {
    id: 'users',
    label: 'Account Management',
    icon: 'mdi:account-supervisor-outline',
    children: [
      { id: 'users-list', label: 'Users List', icon: 'mdi:account-outline', to: '/users' },
      { id: 'verifications', label: 'Verification', icon: 'mdi:how-to-reg', to: '/verifications' },
    ],
  },
  {
    id: 'accommodations',
    label: 'Accommodations',
    icon: 'mdi:home-city-outline',
    children: [
      { id: 'map-view', label: 'Map View', icon: 'mdi:map-outline', to: '/map-view' },
      { id: 'accommodation-hub', label: 'Accommodation Hub', icon: 'mdi:home-city-outline', to: '/accommodation-hub' },
      { id: 'room-hub', label: 'Room Hub', icon: 'mdi:door-open', to: '/room-hub' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'mdi:briefcase-outline',
    children: [
      { id: 'support-tickets', label: 'Support Tickets', icon: 'mdi:headset', to: '/support-tickets' },
      { id: 'announcements', label: 'Announcements', icon: 'mdi:bullhorn-outline', to: '/announcements' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: 'mdi:tune',
    children: [
      { id: 'audit-logs', label: 'Audit Logs', icon: 'mdi:clipboard-list-outline', to: '/audit-logs' },
    ],
  },
];

export interface FlatNavItem extends NavLeaf {
  group?: string;
}

export function flattenNav(): FlatNavItem[] {
  const items: FlatNavItem[] = [{ ...dashboardLeaf }];
  for (const group of navGroups) {
    for (const child of group.children) {
      items.push({ ...child, group: group.label });
    }
  }
  return items;
}
