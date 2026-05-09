import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import MstItemRepository from './item.repository.ts';

const getMasterItems = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = '' } = req.body;

	const mstItemRepo = new MstItemRepository();
	const result = await mstItemRepo.getMasterItems(page, limit, search);

	if (!result.items || result.items.length === 0) {
		throw new AppError('Master items not found', 404);
	}

	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		items: result.items,
		pagination,
		meta: {
			search: search || null,
			sort_by: 'createdAt',
			sort_order: 'desc',
			filters_applied: {},
		},
	});
});

const addMasterItem = asyncHandler(async (req: Request, res: Response) => {
	const mstItemRepo = new MstItemRepository();
	const newItem = await mstItemRepo.addMasterItem(req.body);

	return success(res, {
		item: newItem,
	});
});

const updateMasterItem = asyncHandler(async (req: Request, res: Response) => {
	let { id } = req.params;
	if (!id) {
		throw new AppError('Item ID is required', 400);
	}

  const mstItemRepo = new MstItemRepository();
	const updatedItem = await mstItemRepo.updateMasterItem(Number(id), req.body);

	if (!updatedItem) {
		throw new AppError('Master item not found', 404);
	}

	return success(res, {
		item: updatedItem,
	});
});

const deleteMasterItem = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	if (!id) {
		throw new AppError('Item ID is required', 400);
	}

	const mstItemRepo = new MstItemRepository();
	const deleted = await mstItemRepo.deleteMasterItem(Number(id));

	if (!deleted) {
		throw new AppError('Master item not found', 404);
	}

	return success(res, {
		message: 'Master item deleted successfully',
	});
});

export default {
	getMasterItems,
	addMasterItem,
	updateMasterItem,
	deleteMasterItem,
};
