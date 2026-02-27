export const requestRoutes = [
  {
    path: '/request',
    name: 'request',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Request',
    },
  },
]
