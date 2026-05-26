import express, { Router } from "express";
import vendorController from "./vendor.controller.ts";
import validate from "#shared/middlewares/validate.ts";
import { getMasterSchema, addVendorSchema } from "./vendor.validation.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

router.post(
	"/",
	apiAuth(),
	validate(getMasterSchema),
	vendorController.getMasterVendors,
);

router.post(
	"/add",
	apiAuth(),
	validate(addVendorSchema),
	vendorController.addMstVendor,
);

router.put(
	"/:id",
	apiAuth(),
	validate(addVendorSchema),
	vendorController.updateMstVendor,
);

router.delete("/:id", apiAuth(), vendorController.deleteMstVendor);

export default router;
