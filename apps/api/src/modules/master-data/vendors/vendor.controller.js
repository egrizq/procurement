import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import MstVendorRepository from './vendor.repository.js';

const getMasterVendors = asyncHandler(async (req, res) => {
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

export default {
	getMasterVendors,
};
