import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";

const uploadFiles = asyncHandler(async (req: Request, res: Response) => {
	if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
		throw new AppError("No files uploaded", 400);
	}

	const files = req.files as Express.Multer.File[];
	const uploadedFiles = files.map((file) => {
		return {
			filename: file.filename,
			originalname: file.originalname,
			mimetype: file.mimetype,
			size: file.size,
			// The relative path to access this file via the static server
			url: `/uploads/${file.filename}`,
		};
	});

	return success(res, { files: uploadedFiles }, 201);
});

export default {
	uploadFiles,
};
