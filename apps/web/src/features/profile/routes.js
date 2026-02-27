export const profileRoutes = [
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Profile',
    },
  },
]
