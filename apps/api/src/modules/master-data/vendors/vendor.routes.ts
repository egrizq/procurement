import express, { Router } from 'express';
import vendorController from './vendor.controller.ts';
import validate from '#shared/middlewares/validate.ts';
import { 
	getMasterSchema,
	createVendorSchema,
	updateVendorSchema,
	vendorByIdSchema
} from './vendor.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';

const router: Router = express.Router();

router.post(
	'/',
	apiAuth(),
	validate(getMasterSchema),
	vendorController.getMasterVendors
);

router.post(
	'/create',
	apiAuth(),
	validate(createVendorSchema),
	vendorController.createVendor
);

router.get(
	'/:id',
	apiAuth(),
	validate(vendorByIdSchema),
	vendorController.getVendorById
);

router.put(
	'/:id',
	apiAuth(),
	validate(updateVendorSchema),
	vendorController.updateVendor
);

router.delete(
	'/:id',
	apiAuth(),
	validate(vendorByIdSchema),
	vendorController.deleteVendor
);

export default router;
