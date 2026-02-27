import express from 'express';
import validate from '#shared/middlewares/validate.ts';
import { registerSchema, loginSchema } from './auth.validation.js';
import authController from './auth.controller.js';
import apiAuth from './auth.middleware.js';

const router = express.Router();

// api/auth/register
router.post(
	"/register",
	apiAuth(),
	validate(registerSchema),
	authController.register,
);

// api/auth/login
router.post("/login", validate(loginSchema), authController.login);

// api/auth/logout
router.post("/logout", apiAuth(), authController.logout);

export default router;
