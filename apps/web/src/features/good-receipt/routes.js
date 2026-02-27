export const goodReceiptRoutes = [
  {
    path: '/good-receipt',
    name: 'good-receipt',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Good Receipt',
    },
  },
]
