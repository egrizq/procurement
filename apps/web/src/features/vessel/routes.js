export const vesselRoutes = [
  {
    path: '/vessels',
    name: 'vessels',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Vessels',
    },
  },
]
