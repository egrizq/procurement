import express from 'express';
import itemController from './item.controller.js';
import validate from '#shared/middlewares/validate.ts';
import { getMasterSchema } from './item.validation.js';
import apiAuth from '#modules/auth/auth.middleware.js';

const router = express.Router();

router.post(
	"/",
	apiAuth(),
	validate(getMasterSchema),
	itemController.getMasterItems,
);

export default router;
