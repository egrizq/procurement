import express, { Router } from "express";
import healthRoutes from "./health.ts";
import tokenRoutes from "#modules/api-token/token.routes.ts";
import authRoutes from "#modules/auth/auth.routes.ts";
import profileRoutes from "#modules/profile/profile.routes.ts";
import masterDataRoutes from "#modules/master-data/index.ts";
import vesselRequestRoutes from "#modules/vessel-request/vessel-request.routes.ts";
import settingsStandardRoutes from "#modules/settings/vessel-item-standards/vessel-item-standard.routes.ts";
import userRoutes from "#modules/settings/users/user.routes.ts";
import moduleAccessRoutes from "#modules/settings/module-access/module-access.routes.ts";
import mocRoutes from "#modules/moc/moc.routes.ts";
import dashboardRoutes from "#modules/dashboard/index.ts";
import purchaseOrderRoutes from "#modules/purchase-order/purchase-order.routes.ts";
import goodReceiptRoutes from "#modules/good-receipt/good-receipt.routes.ts";

const router: Router = express.Router();

router.use("/", healthRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/token", tokenRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/master-data", masterDataRoutes);
router.use("/vessel-requests", vesselRequestRoutes);
router.use("/settings/vessel-item-standards", settingsStandardRoutes);
router.use("/settings/users", userRoutes);
router.use("/settings/module-access", moduleAccessRoutes);
router.use("/moc", mocRoutes);
router.use("/purchase-orders", purchaseOrderRoutes);
router.use("/good-receipts", goodReceiptRoutes);

export default router;
