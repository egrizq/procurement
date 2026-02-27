import express, { Router } from 'express';
import validate from '#shared/middlewares/validate.ts';
import { registerSchema, loginSchema } from './auth.validation.ts';
import authController from './auth.controller.ts';
import apiAuth from './auth.middleware.ts';

const router: Router = express.Router();

// api/auth/register
router.post(
	'/register',
	apiAuth(),
	validate(registerSchema),
	authController.register
);

// api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// api/auth/logout
router.post('/logout', apiAuth(), authController.logout);

export default router;
