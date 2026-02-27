export const authRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/Login.vue'),
    meta: {
      title: 'Login',
    },
  },
]
