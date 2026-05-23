import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import DashboardRepository from './dashboard.repository.ts';

const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
	const dashboardRepo = new DashboardRepository();
	
	const stats = await dashboardRepo.getStats();
	const recentActivity = await dashboardRepo.getRecentActivity();

	return success(res, {
		stats,
		recentActivity,
	});
});

export default {
	getDashboardStats,
};
