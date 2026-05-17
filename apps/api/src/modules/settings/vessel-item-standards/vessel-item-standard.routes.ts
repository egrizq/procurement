import { Router } from 'express';
import standardController from './vessel-item-standard.controller.ts';
import {
	getStandardsSchema,
	createStandardSchema,
	updateStandardSchema,
	standardByIdSchema,
} from './vessel-item-standard.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';
import roleAuth from '#shared/middlewares/role-auth.ts';
import validate from '#shared/middlewares/validate.ts';

const router = Router();

router.post('/list', apiAuth(), roleAuth(), validate(getStandardsSchema), standardController.getAll);
router.get('/:id', apiAuth(), roleAuth(), validate(standardByIdSchema), standardController.getById);
router.post('/', apiAuth(), roleAuth(), validate(createStandardSchema), standardController.create);
router.put('/:id', apiAuth(), roleAuth(), validate(updateStandardSchema), standardController.update);
router.delete('/:id', apiAuth(), roleAuth(), validate(standardByIdSchema), standardController.remove);

export default router;
