import express, { Router } from 'express';
import tokenRoutes from '#modules/api-token/token.routes.ts';
import authRoutes from '#modules/auth/auth.routes.ts';
import profileRoutes from '#modules/profile/profile.routes.ts';
import masterDataRoutes from '#modules/master-data/index.ts';
import vesselRequestRoutes from '#modules/vessel-request/vessel-request.routes.ts';

const router: Router = express.Router();

router.use('/token', tokenRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/vessel-requests', vesselRequestRoutes);

export default router;
