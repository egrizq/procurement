import express from 'express';
import vendorRoutes from './vendors/vendor.routes.ts';
import itemRoutes from './items/item.routes.ts';
import categoryItemRoutes from './category-items/category.routes.ts';
import vesselRoutes from './vessels/vessel.routes.ts';
import vesselStockRoutes from './vessel-stocks/vessel-stock.routes.ts';
import cityRoutes from './cities/cities.routes.ts';

const router = express.Router();

// Aggregate all master-data routes
router.use('/vendors', vendorRoutes);
router.use('/items', itemRoutes);
router.use('/category-items', categoryItemRoutes);
router.use('/vessels', vesselRoutes);
router.use('/vessel-stocks', vesselStockRoutes);
router.use('/cities', cityRoutes);

export default router;
