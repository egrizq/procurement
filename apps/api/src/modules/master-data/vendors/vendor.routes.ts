import express, { Router } from 'express';
import vendorController from './vendor.controller.ts';
import validate from '#shared/middlewares/validate.ts';
import { getMasterSchema } from './vendor.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';

const router: Router = express.Router();

router.post(
	'/',
	apiAuth(),
	validate(getMasterSchema),
	vendorController.getMasterVendors
);

export default router;
