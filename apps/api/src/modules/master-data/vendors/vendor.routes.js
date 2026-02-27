import express from 'express';
import vendorController from './vendor.controller.js';
import validate from '#shared/middlewares/validate.ts';
import { getMasterSchema } from './vendor.validation.js';
import apiAuth from '#modules/auth/auth.middleware.js';

const router = express.Router();

router.post(
	"/",
	apiAuth(),
	validate(getMasterSchema),
	vendorController.getMasterVendors,
);

export default router;
