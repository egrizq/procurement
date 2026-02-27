import express, { Router } from 'express';
import itemController from './item.controller.ts';
import validate from '#shared/middlewares/validate.ts';
import { getMasterSchema } from './item.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';

const router: Router = express.Router();

router.post(
	'/',
	apiAuth(),
	validate(getMasterSchema),
	itemController.getMasterItems
);

export default router;
