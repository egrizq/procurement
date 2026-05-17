import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import VesselItemStandardRepository from './vessel-item-standard.repository.ts';
import MstVesselRepository from '../../master-data/vessels/vessel.repository.ts';
import MstItemRepository from '../../master-data/items/item.repository.ts';

const standardRepo = new VesselItemStandardRepository();
const mstVesselRepo = new MstVesselRepository();
const mstItemRepo = new MstItemRepository();

const getAll = asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 10, search = '' } = req.body;

	const stds = await standardRepo.getStandards(page, limit, search);
	const pagination = getPaginationMeta(page, limit, stds.total);

	return success(res, {
		items: stds.items,
		pagination,
		meta: {
			search: search || null,
			filters_applied: {},
		}
	});
});

const getById = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError('Invalid standard ID', 400);
	}

	const std = await standardRepo.findById(id);
	if (!std) {
		throw new AppError('Standard not found', 404);
	}

	return success(res, std);
});

const create = asyncHandler(async (req: Request, res: Response) => {
	const { vesselId, itemId, periode, minStock, maxStock } = req.body;

	const existingStandard = await standardRepo.findByVesselAndItem(vesselId, itemId);
	if (existingStandard) {
        throw new AppError('This item is already set up for this vessel.', 400);
    }

	const vessel = await mstVesselRepo.findVessel({ id: vesselId });
	if (!vessel) throw new AppError('Vessel not found', 400);

	const items = await mstItemRepo.findItemByIds([itemId]);
	if (!items || items.length === 0) throw new AppError('Item not found', 400);

	const std = await standardRepo.create({
		vesselId,
		itemId,
		periode,
		minStock,
		maxStock,
	});

	return success(res, std, 201);
});

const update = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) throw new AppError('Invalid standard ID', 400);

	const existing = await standardRepo.findById(id);
	if (!existing) throw new AppError('Standard not found', 404);

	const { vesselId, itemId, periode, minStock, maxStock } = req.body;

    const newVesselId = vesselId ?? existing.vesselId;
    const newItemId = itemId ?? existing.itemId;

    if (newVesselId !== existing.vesselId || newItemId !== existing.itemId) {
        const existingStandard = await standardRepo.findByVesselAndItem(newVesselId, newItemId);
        if (existingStandard) {
            throw new AppError('This item is already set up for this vessel.', 400);
        }
    }

	if (vesselId) {
		const vessel = await mstVesselRepo.findVessel({ id: vesselId });
		if (!vessel) throw new AppError('Vessel not found', 400);
	}

	if (itemId) {
		const items = await mstItemRepo.findItemByIds([itemId]);
		if (!items || items.length === 0) throw new AppError('Item not found', 400);
	}

	const updateData: any = {};
	if (vesselId !== undefined) updateData.vesselId = vesselId;
	if (itemId !== undefined) updateData.itemId = itemId;
	if (periode !== undefined) updateData.periode = periode;
	if (minStock !== undefined) updateData.minStock = minStock;
	if (maxStock !== undefined) updateData.maxStock = maxStock;

	const std = await standardRepo.update(id, updateData);

	return success(res, std);
});

const remove = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) throw new AppError('Invalid standard ID', 400);

	const deleted = await standardRepo.delete(id);
	if (!deleted) throw new AppError('Standard not found', 404);

	return success(res, deleted, 200);
});

export default {
	getAll,
	getById,
	create,
	update,
	remove,
};