import express from 'express';
import vendorRoutes from './vendors/vendor.routes.js';
import itemRoutes from './items/item.routes.js';
import vesselRoutes from './vessels/vessel.routes.js';

const router = express.Router();

// Aggregate all master-data routes
router.use("/vendors", vendorRoutes);
router.use("/items", itemRoutes);
router.use("/vessels", vesselRoutes);

export default router;
