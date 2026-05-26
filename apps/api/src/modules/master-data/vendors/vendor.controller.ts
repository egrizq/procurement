import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import MstVendorRepository from "./vendor.repository.ts";
import { categoryVendorEnum } from "../../../db/schema/index.ts";

const getMasterVendors = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = "" } = req.body;

	const mstVendorRepo = new MstVendorRepository();
	const result = await mstVendorRepo.getMasterVendors(page, limit, search);

	if (!result.vendors || result.vendors.length === 0) {
		throw new AppError("Master vendors not found", 404);
	}

	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		vendors: result.vendors,
		pagination,
		meta: {
			search: search || null,
			sort_by: "createdAt",
			sort_order: "desc",
			filters_applied: {},
		},
	});
});

const addMstVendor = asyncHandler(async (req: Request, res: Response) => {
	let { name, category, address, phone, email, city } = req.body;

	const mstVendorRepo = new MstVendorRepository();

	category = categoryVendorEnum[category];
	if (!category) {
		throw new AppError("Invalid category value", 400);
	}
	const newVendor = await mstVendorRepo.addMstVendor({
		name,
		category,
		address,
		phone,
		email,
		city,
	});

	return success(res, {
		vendor: newVendor,
	});
});

const updateMstVendor = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	let { name, category, address, phone, email, city } = req.body;

	const mstVendorRepo = new MstVendorRepository();

	category = categoryVendorEnum[category];
	if (!category) {
		throw new AppError("Invalid category value", 400);
	}
	const updatedVendor = await mstVendorRepo.updateMstVendor(Number(id), {
		name,
		category,
		address,
		phone,
		email,
		city,
	});

	return success(res, {
		vendor: updatedVendor,
	});
});

const deleteMstVendor = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;

	const mstVendorRepo = new MstVendorRepository();
	await mstVendorRepo.deleteMstVendor(Number(id));

	return success(res, {
		message: "Vendor deleted successfully",
	});
});

export default {
	getMasterVendors,
	addMstVendor,
	updateMstVendor,
	deleteMstVendor,
};
