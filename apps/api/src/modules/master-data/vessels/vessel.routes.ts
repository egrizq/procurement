import express, { Router } from 'express';
import vesselController from './vessel.controller.ts';
import validate from '#shared/middlewares/validate.ts';
import { getMasterSchema } from './vessel.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';

const router: Router = express.Router();

router.post(
	'/',
	apiAuth(),
	validate(getMasterSchema),
	vesselController.getMasterVessels
);

export default router;
