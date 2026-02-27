export const mocRoutes = [
  {
    path: '/moc',
    name: 'moc',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'MOC',
    },
  },
]
