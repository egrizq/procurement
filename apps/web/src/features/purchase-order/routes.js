export const purchaseOrderRoutes = [
  {
    path: '/purchase-orders',
    name: 'PurchaseOrder',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Purchase Order',
      requiresAuth: true,
    },
  },
]
