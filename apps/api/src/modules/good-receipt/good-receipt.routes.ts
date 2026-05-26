import { Router } from "express";
import controller from "./good-receipt.controller.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";
import roleAuth from "#shared/middlewares/role-auth.ts";
import validate from "#shared/middlewares/validate.ts";
import {
	createGoodReceiptSchema,
	goodReceiptListSchema,
	goodReceiptByIdSchema,
} from "./good-receipt.validation.ts";

const router = Router();

router.use(apiAuth());

router.post(
	"/list",
	roleAuth(),
	validate(goodReceiptListSchema),
	controller.getGoodReceipts,
);
router.get("/po-list", roleAuth(), controller.getPendingPOsForReceipt);
router.post(
	"/",
	roleAuth(),
	validate(createGoodReceiptSchema),
	controller.createGoodReceipt,
);
router.get(
	"/:id",
	roleAuth(),
	validate(goodReceiptByIdSchema),
	controller.getGoodReceiptById,
);

export default router;
