import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import ModuleAccessRepository from './module-access.repository.ts';
import db from '#config/drizzle.ts';
import { users } from '../../../db/schema/index.ts';
import { eq } from 'drizzle-orm';

const repo = new ModuleAccessRepository();

const getMyModules = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken?.userId;
	if (!userId) {
		throw new AppError('Authentication required', 401);
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { type: true },
	});

	if (!user) {
		throw new AppError('User account not found', 401);
	}

	const modules = await repo.getPermittedSlugs(user.type);
	return success(res, { userType: user.type, modules });
});

const getAll = asyncHandler(async (_req: Request, res: Response) => {
	const mappings = await repo.getAllMappings();

	return success(res, { mappings });
});

const addMapping = asyncHandler(async (req: Request, res: Response) => {
	const { userType, moduleSlug } = req.body;

	// Check for duplicate mapping
	const existing = await repo.getMappingsByUserType(userType);
	const alreadyExists = existing.some((m) => m.moduleSlug === moduleSlug);
	if (alreadyExists) {
		throw new AppError('Mapping already exists', 409);
	}

	// Insert the new mapping
	await repo.addMapping(userType, moduleSlug);

	// Return updated mappings for that userType
	const updatedMappings = await repo.getMappingsByUserType(userType);
	return success(res, { mappings: updatedMappings }, 201);
});

const removeMapping = asyncHandler(async (req: Request, res: Response) => {
	const { userType, moduleSlug } = req.body;

	// Prevent removing Admin access to the access-management screens
	if (userType === 'Admin' && ['settings', 'settings/users', 'settings/module-access'].includes(moduleSlug)) {
		throw new AppError('Cannot remove Admin access to user and role access settings', 400);
	}

	// Delete the mapping
	await repo.removeMapping(userType, moduleSlug);

	// Return updated mappings for that userType
	const updatedMappings = await repo.getMappingsByUserType(userType);
	return success(res, { mappings: updatedMappings });
});

export default {
	getMyModules,
	getAll,
	addMapping,
	removeMapping,
};
