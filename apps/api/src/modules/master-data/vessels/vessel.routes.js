import express from 'express';
import vesselController from './vessel.controller.js';
import validate from '#shared/middlewares/validate.ts';
import { getMasterSchema } from './vessel.validation.js';
import apiAuth from '#modules/auth/auth.middleware.js';

const router = express.Router();

router.post(
	"/",
	apiAuth(),
	validate(getMasterSchema),
	vesselController.getMasterVessels,
);

export default router;
