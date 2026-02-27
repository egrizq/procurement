import express, { Router } from 'express';
import validate from '#shared/middlewares/validate.ts';
import {
	vesselRequestSchema,
	vesselRequestListSchema,
	vesselRequestByIdSchema,
	updateVesselRequestSchema,
} from './vessel-request.validation.ts';
import vesselRequestController from './vessel-request.controller.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';

const router: Router = express.Router();

router.post(
	'/',
	apiAuth(),
	validate(vesselRequestSchema),
	vesselRequestController.create
);

router.post(
	'/list/:id',
	apiAuth(),
	validate(vesselRequestByIdSchema),
	vesselRequestController.getById
);

router.post(
	'/list',
	apiAuth(),
	validate(vesselRequestListSchema),
	vesselRequestController.getAll
);

router.put(
	'/:id',
	apiAuth(),
	validate(updateVesselRequestSchema),
	vesselRequestController.update
);

export default router;
