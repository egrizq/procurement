export const auditLogRoutes = [
  {
    path: '/audit-log',
    name: 'audit-log',
    component: () => import('./views/Index.vue'),
    meta: {
      title: 'Audit Log',
    },
  },
]
