import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import ProfileRepository from "./profile.repository.ts";

const profileRepo = new ProfileRepository();

const getProfile = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;

	const user = await profileRepo.getUserById(userId);
	if (!user) {
		throw new AppError("User not found", 404);
	}

	return success(res, user);
});

export default {
	getProfile,
};
