import express from 'express';
import profileController from './profile.controller.js';
import apiAuth from '#modules/auth/auth.middleware.js';

const router = express.Router();

// GET /api/profile
router.get("/", apiAuth(), profileController.getProfile);

export default router;
