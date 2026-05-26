import express, { Router } from "express";
import vesselStockController from "./vessel-stock.controller.ts";
import validate from "#shared/middlewares/validate.ts";
import {
	getMasterSchema,
	createVesselStockSchema,
	updateVesselStockSchema,
	vesselStockByIdSchema,
} from "./vessel-stock.validation.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

// List vessel stocks (paginated + search)
router.post(
	"/",
	apiAuth(),
	validate(getMasterSchema),
	vesselStockController.getVesselStocks,
);

// Get vessel stock by ID
router.get(
	"/:id",
	apiAuth(),
	validate(vesselStockByIdSchema),
	vesselStockController.getById,
);

// Create vessel stock
router.post(
	"/create",
	apiAuth(),
	validate(createVesselStockSchema),
	vesselStockController.create,
);

// Update vessel stock
router.put(
	"/:id",
	apiAuth(),
	validate(updateVesselStockSchema),
	vesselStockController.update,
);

// Delete vessel stock
router.delete(
	"/:id",
	apiAuth(),
	validate(vesselStockByIdSchema),
	vesselStockController.remove,
);

export default router;
