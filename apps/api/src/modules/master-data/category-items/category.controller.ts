import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import CategoryRepository from "./category.repository.ts";

const getCategories = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = "" } = req.body;

	const categoryRepo = new CategoryRepository();
	const result = await categoryRepo.getCategories(page, limit, search);

	if (!result.categories || result.categories.length === 0) {
		throw new AppError("Categories not found", 404);
	}

	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		items: result.categories,
		pagination,
		meta: {
			search: search || null,
			sort_by: "createdAt",
			sort_order: "desc",
			filters_applied: {},
		},
	});
});

const addCategory = asyncHandler(async (req: Request, res: Response) => {
	const categoryRepo = new CategoryRepository();
	const newCategory = await categoryRepo.addCategory(req.body);

	return success(res, {
		item: newCategory,
	});
});

const updateCategory = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	if (!id) {
		throw new AppError("Category ID is required", 400);
	}

	const categoryRepo = new CategoryRepository();
	const updatedCategory = await categoryRepo.updateCategory(
		Number(id),
		req.body,
	);

	if (!updatedCategory) {
		throw new AppError("Category not found", 404);
	}

	return success(res, {
		item: updatedCategory,
	});
});

const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	if (!id) {
		throw new AppError("Category ID is required", 400);
	}

	const categoryRepo = new CategoryRepository();
	const deleted = await categoryRepo.deleteCategory(Number(id));

	if (!deleted) {
		throw new AppError("Category not found", 404);
	}

	return success(res, {
		message: "Category deleted successfully",
	});
});

export default {
	getCategories,
	addCategory,
	updateCategory,
	deleteCategory,
};
