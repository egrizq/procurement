import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '../features/auth/routes.js'
import { dashboardRoutes } from '../features/dashboard/routes.js'
import { masterDataRoutes } from '../features/master-data/routes.js'
import { profileRoutes } from '../features/profile/routes.js'
import { vesselRoutes } from '../features/vessel/routes.js'
import { requestRoutes } from '../features/request/routes.js'
import { mocRoutes } from '../features/moc/routes.js'
import { purchaseOrderRoutes } from '../features/purchase-order/routes.js'
import { goodReceiptRoutes } from '../features/good-receipt/routes.js'
import { settingsRoutes } from '../features/settings/routes.js'
import { auditLogRoutes } from '../features/audit-log/routes.js'
import MainLayout from '../components/layout/MainLayout.vue'

const routes = [
  ...authRoutes,
  {
    path: '/',
    component: MainLayout,
    children: [
      ...dashboardRoutes,
      ...masterDataRoutes,
      ...profileRoutes,
      ...vesselRoutes,
      ...requestRoutes,
      ...mocRoutes,
      ...purchaseOrderRoutes,
      ...goodReceiptRoutes,
      ...settingsRoutes,
      ...auditLogRoutes,
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
