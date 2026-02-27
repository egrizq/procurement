export const dashboardRoutes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Dashboard',
    },
  },
]
