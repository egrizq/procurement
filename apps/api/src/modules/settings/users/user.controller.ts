import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import { hashPassword } from "#shared/utils/password.ts";
import UserRepository from "./user.repository.ts";
import MstVesselRepository from "../../master-data/vessels/vessel.repository.ts";

const userRepo = new UserRepository();
const mstVesselRepo = new MstVesselRepository();

const getAll = asyncHandler(async (req: Request, res: Response) => {
	const {
		page = 1,
		limit = 10,
		search = "",
		type,
		department,
		status,
	} = req.body;

	const filters: { type?: string; department?: string; status?: string } = {};
	if (type) filters.type = type;
	if (department) filters.department = department;
	if (status) filters.status = status;

	const result = await userRepo.getUsers(page, limit, search, filters);
	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		items: result.items,
		pagination,
		meta: {
			search: search || null,
			filters_applied: filters,
		},
	});
});

const getById = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError("Invalid user ID", 400);
	}

	const user = await userRepo.findById(id);
	if (!user) {
		throw new AppError("User not found", 404);
	}

	return success(res, user);
});

const create = asyncHandler(async (req: Request, res: Response) => {
	const {
		username,
		email,
		password,
		fullName,
		type,
		department,
		vesselId,
		position,
		status,
		imgUrl,
	} = req.body;

	// Check username uniqueness
	const existingUsername = await userRepo.findByUsername(username);
	if (existingUsername) {
		throw new AppError("Username already exists", 409);
	}

	// Check email uniqueness
	const existingEmail = await userRepo.findByEmail(email);
	if (existingEmail) {
		throw new AppError("Email already exists", 409);
	}

	// Validate vesselId exists
	const vessel = await mstVesselRepo.findVessel({ id: vesselId });
	if (!vessel) {
		throw new AppError("Vessel does not exist", 400);
	}

	// Hash password
	const hashedPassword = await hashPassword(password);

	const user = await userRepo.create({
		username,
		email,
		password: hashedPassword,
		fullName,
		type,
		department,
		vesselId,
		position,
		status,
		imgUrl,
	});

	return success(res, user, 201);
});

const update = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError("Invalid user ID", 400);
	}

	// Check user exists
	const existing = await userRepo.findById(id);
	if (!existing) {
		throw new AppError("User not found", 404);
	}

	const {
		username,
		email,
		password,
		fullName,
		type,
		department,
		vesselId,
		position,
		status,
		leaveDate,
		imgUrl,
	} = req.body;

	// Check username uniqueness (excluding current user)
	if (username) {
		const existingUsername = await userRepo.findByUsername(username);
		if (existingUsername && existingUsername.id !== id) {
			throw new AppError("Username already exists", 409);
		}
	}

	// Check email uniqueness (excluding current user)
	if (email) {
		const existingEmail = await userRepo.findByEmail(email);
		if (existingEmail && existingEmail.id !== id) {
			throw new AppError("Email already exists", 409);
		}
	}

	// Validate vesselId if provided
	if (vesselId) {
		const vessel = await mstVesselRepo.findVessel({ id: vesselId });
		if (!vessel) {
			throw new AppError("Vessel does not exist", 400);
		}
	}

	// Build update data
	const updateData: Record<string, any> = {};
	if (username !== undefined) updateData.username = username;
	if (email !== undefined) updateData.email = email;
	if (fullName !== undefined) updateData.fullName = fullName;
	if (type !== undefined) updateData.type = type;
	if (department !== undefined) updateData.department = department;
	if (vesselId !== undefined) updateData.vesselId = vesselId;
	if (position !== undefined) updateData.position = position;
	if (status !== undefined) updateData.status = status;
	if (leaveDate !== undefined) updateData.leaveDate = leaveDate;
	if (imgUrl !== undefined) updateData.imgUrl = imgUrl;

	// Hash password if provided
	if (password) {
		updateData.password = await hashPassword(password);
	}

	const user = await userRepo.update(id, updateData);

	return success(res, user);
});

const remove = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError("Invalid user ID", 400);
	}

	// Check user exists
	const existing = await userRepo.findById(id);
	if (!existing) {
		throw new AppError("User not found", 404);
	}

	// Check if user is already deactivated
	if (existing.status === "Leave") {
		throw new AppError("User is already deactivated", 409);
	}

	const user = await userRepo.softDelete(id);

	return success(res, user);
});

export default {
	getAll,
	getById,
	create,
	update,
	remove,
};
