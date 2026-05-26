import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import GoodReceiptRepository from "./good-receipt.repository.ts";

const grRepo = new GoodReceiptRepository();

const createGoodReceipt = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const { purchaseOrderId, isSameItem, reason } = req.body;

	try {
		const gr = await grRepo.createGoodReceipt({
			purchaseOrderId,
			isSameItem,
			reason,
			createdBy: userId,
		});
		return success(res, { goodReceipt: gr }, 201);
	} catch (err: any) {
		throw new AppError(err.message || "Failed to create Good Receipt", 400);
	}
});

const getGoodReceipts = asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 10, search = "", status } = req.body;

	const result = await grRepo.getGoodReceipts(
		Number(page),
		Number(limit),
		search,
		status,
	);
	const pagination = getPaginationMeta(
		Number(page),
		Number(limit),
		result.total,
	);

	return success(res, { goodReceipts: result.items, pagination });
});

const getGoodReceiptById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const gr = await grRepo.getGoodReceiptById(Number(id));
	if (!gr) throw new AppError("Good Receipt not found", 404);
	return success(res, { goodReceipt: gr });
});

const getPendingPOsForReceipt = asyncHandler(
	async (_req: Request, res: Response) => {
		try {
			const pos = await grRepo.getPendingPOsForReceipt();
			return success(res, { purchaseOrders: pos });
		} catch (err: any) {
			throw new AppError(
				err.message || "Failed to fetch pending purchase orders",
				400,
			);
		}
	},
);

export default {
	createGoodReceipt,
	getGoodReceipts,
	getGoodReceiptById,
	getPendingPOsForReceipt,
};
