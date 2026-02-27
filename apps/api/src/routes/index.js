import express from 'express';
import tokenRoutes from '#modules/api-token/token.routes.js';
import authRoutes from '#modules/auth/auth.routes.js';
import profileRoutes from '#modules/profile/profile.routes.js';
import masterDataRoutes from '#modules/master-data/index.js';
import vesselRequestRoutes from '#modules/vessel-request/vessel-request.routes.js';

const router = express.Router();

router.use('/token', tokenRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/vessel-requests', vesselRequestRoutes);

export default router;
