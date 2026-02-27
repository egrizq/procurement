import express from 'express';
import vendorRoutes from './vendors/vendor.routes.ts';
import itemRoutes from './items/item.routes.ts';
import vesselRoutes from './vessels/vessel.routes.ts';

const router = express.Router();

// Aggregate all master-data routes
router.use('/vendors', vendorRoutes);
router.use('/items', itemRoutes);
router.use('/vessels', vesselRoutes);

export default router;
