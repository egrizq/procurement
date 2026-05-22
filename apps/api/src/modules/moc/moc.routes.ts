import { Router } from 'express';
import controller from './moc.controller.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';
import validate from '#shared/middlewares/validate.ts';
import {
  mocSchema,
  mocListSchema,
  mocByIdSchema,
} from './moc.validation.ts';

const router = Router();

// Apply auth middleware to all routes
router.use(apiAuth());

router.post('/list', validate(mocListSchema), controller.getMocs);
router.post('/', validate(mocSchema), controller.createMoc);
router.get('/:id', validate(mocByIdSchema), controller.getMocById);
router.put('/:id', validate(mocSchema), controller.updateMoc);
router.delete('/:id', validate(mocByIdSchema), controller.deleteMoc);
router.post('/:id/score', validate(mocByIdSchema), controller.scoreMoc);

export default router;
