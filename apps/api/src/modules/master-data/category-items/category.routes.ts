import express, { Router } from 'express';
import categoryController from './category.controller.ts';
import validate from '#shared/middlewares/validate.ts';
import { getMasterSchema } from '@procurement/validators/master-data';
import apiAuth from '#modules/auth/auth.middleware.ts';

const router: Router = express.Router();

router.post(
    '/',
    apiAuth(),
    validate(getMasterSchema),
    categoryController.getCategories
);

export default router;