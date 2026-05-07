import { Router } from 'express';
import standardController from './vessel-item-standard.controller.ts';
import {
	getStandardsSchema,
	createStandardSchema,
	updateStandardSchema,
	standardByIdSchema,
} from './vessel-item-standard.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';
import validate from '#shared/middlewares/validate.ts';

const router = Router();

router.post('/list', apiAuth(), validate(getStandardsSchema), standardController.getAll);
router.get('/:id', apiAuth(), validate(standardByIdSchema), standardController.getById);
router.post('/', apiAuth(), validate(createStandardSchema), standardController.create);
router.put('/:id', apiAuth(), validate(updateStandardSchema), standardController.update);
router.delete('/:id', apiAuth(), validate(standardByIdSchema), standardController.remove);

export default router;