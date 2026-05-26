import express, { Router } from "express";
import categoryController from "./category.controller.ts";
import validate from "#shared/middlewares/validate.ts";
import {
	getMasterSchema,
	addCategorySchema,
	updateCategorySchema,
} from "@procurement/validators/master-data";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

router.post(
	"/",
	apiAuth(),
	validate(getMasterSchema),
	categoryController.getCategories,
);

router.post(
	"/add",
	apiAuth(),
	validate(addCategorySchema),
	categoryController.addCategory,
);

router.put(
	"/:id",
	apiAuth(),
	validate(updateCategorySchema),
	categoryController.updateCategory,
);

router.delete("/:id", apiAuth(), categoryController.deleteCategory);

export default router;
