import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import MstVendorRepository from './vendor.repository.ts';

const getMasterVendors = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = '' } = req.body;

	const mstVendorRepo = new MstVendorRepository();
	const result = await mstVendorRepo.getMasterVendors(page, limit, search);

	if (!result.vendors || result.vendors.length === 0) {
		throw new AppError('Master vendors not found', 404);
	}

	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		vendors: result.vendors,
		pagination,
		meta: {
			search: search || null,
			sort_by: 'createdAt',
			sort_order: 'desc',
			filters_applied: {},
		},
	});
});

const createVendor = asyncHandler(async (req: Request, res: Response) => {
	const mstVendorRepo = new MstVendorRepository();
	const vendor = await mstVendorRepo.createVendor(req.body);

	return success(res, vendor, 201);
});

const getVendorById = asyncHandler(async (req: Request, res: Response) => {
	const mstVendorRepo = new MstVendorRepository();
	const vendor = await mstVendorRepo.getVendorById(Number(req.params.id));

	if (!vendor) {
		throw new AppError('Vendor not found', 404);
	}

	return success(res, vendor);
});

const updateVendor = asyncHandler(async (req: Request, res: Response) => {
	const mstVendorRepo = new MstVendorRepository();
	
	const existing = await mstVendorRepo.getVendorById(Number(req.params.id));
	if (!existing) {
		throw new AppError('Vendor not found', 404);
	}

	const vendor = await mstVendorRepo.updateVendor(Number(req.params.id), req.body);

	return success(res, vendor);
});

const deleteVendor = asyncHandler(async (req: Request, res: Response) => {
	const mstVendorRepo = new MstVendorRepository();
	
	const existing = await mstVendorRepo.getVendorById(Number(req.params.id));
	if (!existing) {
		throw new AppError('Vendor not found', 404);
	}

	await mstVendorRepo.deleteVendor(Number(req.params.id));

	return success(res, { message: 'Vendor deleted successfully' });
});

export default {
	getMasterVendors,
	createVendor,
	getVendorById,
	updateVendor,
	deleteVendor,
};
