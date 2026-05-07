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
    ],
  },
]