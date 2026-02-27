import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import MstVesselRepository from './vessel.repository.ts';

const getMasterVessels = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = '' } = req.body;

	const mstVesselRepo = new MstVesselRepository();
	const result = await mstVesselRepo.getMasterVessels(page, limit, search);

	if (!result.vessels || result.vessels.length === 0) {
		throw new AppError('Master vessels not found', 404);
	}

	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		vessels: result.vessels,
		pagination,
		meta: {
			search: search || null,
			sort_by: 'createdAt',
			sort_order: 'desc',
			filters_applied: {},
		},
	});
});

export default {
	getMasterVessels,
};
