import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import VesselStockRepository from "./vessel-stock.repository.ts";
import MstVesselRepository from "#modules/master-data/vessels/vessel.repository.ts";
import MstItemRepository from "#modules/master-data/items/item.repository.ts";

const vesselStockRepo = new VesselStockRepository();
const mstVesselRepo = new MstVesselRepository();
const mstItemRepo = new MstItemRepository();

const getVesselStocks = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = "" } = req.body;

	const result = await vesselStockRepo.getVesselStocks(page, limit, search);

	if (!result.items || result.items.length === 0) {
		throw new AppError("Vessel stocks not found", 404);
	}

	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		items: result.items,
		pagination,
		meta: {
			search: search || null,
			sort_by: "lastUpdate",
			sort_order: "desc",
			filters_applied: {},
		},
	});
});

const getById = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError("Invalid vessel stock ID", 400);
	}

	const vesselStock = await vesselStockRepo.findById(id);
	if (!vesselStock) {
		throw new AppError("Vessel stock not found", 404);
	}

	return success(res, vesselStock);
});

const create = asyncHandler(async (req: Request, res: Response) => {
	const { vesselId, itemId, stockOnHand, lastUpdate } = req.body;

	// Validate vessel exists
	const vessel = await mstVesselRepo.findVessel({ id: vesselId });
	if (!vessel) {
		throw new AppError("Vessel not found", 400);
	}

	// Validate item exists
	const items = await mstItemRepo.findItemByIds([itemId]);
	if (!items || items.length === 0) {
		throw new AppError("Item not found", 400);
	}

	const vesselStock = await vesselStockRepo.create({
		vesselId,
		itemId,
		stockOnHand,
		lastUpdate: new Date(lastUpdate),
	});

	return success(res, vesselStock, 201);
});

const update = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError("Invalid vessel stock ID", 400);
	}

	const existing = await vesselStockRepo.findById(id);
	if (!existing) {
		throw new AppError("Vessel stock not found", 404);
	}

	const { vesselId, itemId, stockOnHand, lastUpdate } = req.body;

	// Validate vessel if changed
	if (vesselId) {
		const vessel = await mstVesselRepo.findVessel({ id: vesselId });
		if (!vessel) {
			throw new AppError("Vessel not found", 400);
		}
	}

	// Validate item if changed
	if (itemId) {
		const items = await mstItemRepo.findItemByIds([itemId]);
		if (!items || items.length === 0) {
			throw new AppError("Item not found", 400);
		}
	}

	const updateData: any = {};
	if (vesselId !== undefined) updateData.vesselId = vesselId;
	if (itemId !== undefined) updateData.itemId = itemId;
	if (stockOnHand !== undefined) updateData.stockOnHand = stockOnHand;
	if (lastUpdate !== undefined) updateData.lastUpdate = new Date(lastUpdate);

	const vesselStock = await vesselStockRepo.update(id, updateData);

	return success(res, vesselStock);
});

const remove = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError("Invalid vessel stock ID", 400);
	}

	const existing = await vesselStockRepo.findById(id);
	if (!existing) {
		throw new AppError("Vessel stock not found", 404);
	}

	await vesselStockRepo.delete(id);

	return success(res, null);
});

export default {
	getVesselStocks,
	getById,
	create,
	update,
	remove,
};
