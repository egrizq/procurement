import { Router } from 'express';
import userController from './user.controller.ts';
import { getUsersSchema, createUserSchema, updateUserSchema, userByIdSchema } from './user.validation.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';
import roleAuth from '#shared/middlewares/role-auth.ts';
import validate from '#shared/middlewares/validate.ts';

const router = Router();

router.post('/list', apiAuth(), roleAuth(), validate(getUsersSchema), userController.getAll);
router.get('/:id', apiAuth(), roleAuth(), validate(userByIdSchema), userController.getById);
router.post('/', apiAuth(), roleAuth(), validate(createUserSchema), userController.create);
router.put('/:id', apiAuth(), roleAuth(), validate(updateUserSchema), userController.update);
router.delete('/:id', apiAuth(), roleAuth(), validate(userByIdSchema), userController.remove);

export default router;
