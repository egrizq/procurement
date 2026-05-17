export const settingsRoutes = [
  {
    path: 'settings',
    children: [
      {
        path: 'vessel-item-standard',
        name: 'VesselItemStandard',
        component: () => import('./vessel-item-standard/views/Index.vue'),
        meta: {
          title: 'Vessel Item Standard',
          requiresAuth: true,
        },
      },
      {
        path: 'users',
        name: 'SettingsUsers',
        component: () => import('./users/views/Index.vue'),
        meta: {
          title: 'Manage Users',
          requiresAuth: true,
        },
      },
      {
        path: 'module-access',
        name: 'SettingsModuleAccess',
        component: () => import('./module-access/views/Index.vue'),
        meta: {
          title: 'Role Access',
          requiresAuth: true,
        },
      },
    ],
  },
]
