import { Router } from 'express';
import moduleAccessController from './module-access.controller.ts';
import { addMappingSchema, removeMappingSchema } from './module-access.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';
import roleAuth from '#shared/middlewares/role-auth.ts';
import validate from '#shared/middlewares/validate.ts';

const router = Router();

router.get('/me', apiAuth(), moduleAccessController.getMyModules);
router.get('/', apiAuth(), roleAuth(), moduleAccessController.getAll);
router.post('/', apiAuth(), roleAuth(), validate(addMappingSchema), moduleAccessController.addMapping);
router.delete('/', apiAuth(), roleAuth(), validate(removeMappingSchema), moduleAccessController.removeMapping);

export default router;
