import { Router } from 'express';
import controller from './purchase-order.controller.ts';
import apiAuth from '#modules/auth/auth.middleware.ts';
import roleAuth from '#shared/middlewares/role-auth.ts';
import validate from '#shared/middlewares/validate.ts';
import {
  createPOSchema,
  poListSchema,
  poByIdSchema,
  approvePOSchema,
  rejectPOSchema,
} from './purchase-order.validation.ts';

const router = Router();

router.use(apiAuth());

router.post('/list', roleAuth(), validate(poListSchema), controller.getPOs);
router.post('/', roleAuth(), validate(createPOSchema), controller.createPO);
router.get('/:id/pdf', roleAuth(), validate(poByIdSchema), controller.generatePdf);
router.get('/:id', roleAuth(), validate(poByIdSchema), controller.getPOById);
router.post('/:id/approve', roleAuth(), validate(approvePOSchema), controller.approvePO);
router.post('/:id/reject', roleAuth(), validate(rejectPOSchema), controller.rejectPO);

export default router;
