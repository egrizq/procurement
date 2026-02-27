export const purchaseOrderRoutes = [
  {
    path: '/purchase-order',
    name: 'purchase-order',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Purchase Order',
    },
  },
]
