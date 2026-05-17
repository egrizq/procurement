import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import MstCityRepository from './cities.repository.ts';

const getMasterCities = asyncHandler(async (req: Request, res: Response) => {
    const mstCityRepo = new MstCityRepository();
	const result = await mstCityRepo.getMasterCities();
    console.log('Master cities result:', result); // Debug log

	if (!result || result.flattenedCities.length === 0) {
		throw new AppError('Master cities not found', 404);
	}

	return success(res, result.flattenedCities);
});

export default {
    getMasterCities,
};