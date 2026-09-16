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
  icon: 'lucide:layout-dashboard',
  to: '/dashboard',
};

export const navGroups: NavGroup[] = [
  {
    id: 'users',
    label: 'Account Management',
    icon: 'lucide:users',
    children: [
      { id: 'users-list', label: 'Users List', icon: 'lucide:user', to: '/users' },
      { id: 'verifications', label: 'Verification', icon: 'lucide:user-check', to: '/verifications' },
    ],
  },
  {
    id: 'accommodations',
    label: 'Accommodations',
    icon: 'lucide:building-2',
    children: [
      { id: 'map-view', label: 'Map View', icon: 'lucide:map', to: '/map-view' },
      { id: 'accommodation-hub', label: 'Accommodation Hub', icon: 'lucide:building-2', to: '/accommodation-hub' },
      { id: 'room-hub', label: 'Room Hub', icon: 'lucide:door-open', to: '/room-hub' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'lucide:briefcase',
    children: [
      { id: 'support-tickets', label: 'Support Tickets', icon: 'lucide:headset', to: '/support-tickets' },
      { id: 'announcements', label: 'Announcements', icon: 'lucide:megaphone', to: '/announcements' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: 'lucide:sliders-horizontal',
    children: [
      { id: 'audit-logs', label: 'Audit Logs', icon: 'lucide:clipboard-list', to: '/audit-logs' },
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
