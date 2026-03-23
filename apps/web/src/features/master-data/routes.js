export const masterDataRoutes = [
  // {
  //   path: '/master-data/vessels',
  //   name: 'master-data-vessels',
  //   component: () => import('./vessels/views/Index.vue'),
  //   meta: {
  //     title: 'Vessels',
  //   },
  // },
  {
    path: '/master-data/items',
    name: 'master-data-items',
    component: () => import('./items/views/Items.vue'),
    meta: {
      title: 'Items',
    },
  },
  {
    path: '/master-data/vendors',
    name: 'master-data-vendors',
    component: () => import('./vendors/views/Index.vue'),
    meta: {
      title: 'Vendors',
    },
  },
  {
    path: '/master-data/category-items',
    name: 'master-data-category-items',
    component: () => import('./category-items/views/Index.vue'),
    meta: {
      title: 'Category Items',
    },
  },
  {
    path: '/master-data/vessel-stocks',
    name: 'master-data-vessel-stocks',
    component: () => import('./vessel-stocks/views/Index.vue'),
    meta: {
      title: 'Vessel Stock',
    },
  },
]
