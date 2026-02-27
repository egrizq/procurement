import express from 'express';
import tokenController from './token.controller.js';
import validate from '#shared/middlewares/validate.ts';
import { createApiTokenSchema } from './token.validation.js';
import apiAuth from '#modules/auth/auth.middleware.js';

const router = express.Router();

// api/token
router.post(
	"/",
	validate(createApiTokenSchema),
	tokenController.createApiToken,
);

// api/token/info
router.get("/info", apiAuth(), tokenController.getTokenInfo);

export default router;
