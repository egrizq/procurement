import express, { Router } from "express";
import itemController from "./item.controller.ts";
import validate from "#shared/middlewares/validate.ts";
import {
	getMasterSchema,
	addItemSchema,
	updateItemSchema,
} from "./item.validation.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

router.post(
	"/",
	apiAuth(),
	validate(getMasterSchema),
	itemController.getMasterItems,
);

router.post(
	"/add",
	apiAuth(),
	validate(addItemSchema),
	itemController.addMasterItem,
);

router.put(
	"/:id",
	apiAuth(),
	validate(updateItemSchema),
	itemController.updateMasterItem,
);

router.delete("/:id", apiAuth(), itemController.deleteMasterItem);

export default router;
