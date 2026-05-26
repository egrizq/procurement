import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import MstVesselRepository from "./vessel.repository.ts";

const getMasterVessels = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = "" } = req.body;

	const mstVesselRepo = new MstVesselRepository();
	const result = await mstVesselRepo.getMasterVessels(page, limit, search);

	if (!result.vessels || result.vessels.length === 0) {
		throw new AppError("Master vessels not found", 404);
	}

	const pagination = getPaginationMeta(page, limit, result.total);

	return success(res, {
		vessels: result.vessels,
		pagination,
		meta: {
			search: search || null,
			sort_by: "createdAt",
			sort_order: "desc",
			filters_applied: {},
		},
	});
});

const getVesselById = asyncHandler(async (req: Request, res: Response) => {
	const id = parseInt(req.params.id);
	if (isNaN(id)) throw new AppError("Invalid vessel ID", 400);

	const mstVesselRepo = new MstVesselRepository();
	const vessel = await mstVesselRepo.findVessel({ id });

	if (!vessel) throw new AppError("Vessel not found", 404);

	return success(res, vessel);
});

const createVessel = asyncHandler(async (req: Request, res: Response) => {
	const { imoNumber, name, flag, type, status, imgUrl } = req.body;
	const data = { imoNumber, name, flag, type, status, imgUrl };
	const mstVesselRepo = new MstVesselRepository();
	const result = await mstVesselRepo.createVessel(data);

	return success(res, { message: "Vessel created successfully", result }, 201);
});

const updateVessel = asyncHandler(async (req: Request, res: Response) => {
	const id = parseInt(req.params.id);
	if (isNaN(id)) throw new AppError("Invalid vessel ID", 400);

	const { imoNumber, name, flag, type, status, imgUrl } = req.body;
	const data = { imoNumber, name, flag, type, status, imgUrl };
	const mstVesselRepo = new MstVesselRepository();

	const existingVessel = await mstVesselRepo.findVessel({ id });
	if (!existingVessel) throw new AppError("Vessel not found", 404);

	await mstVesselRepo.updateVessel(id, data);

	return success(res, { message: "Vessel updated successfully" });
});

const deleteVessel = asyncHandler(async (req: Request, res: Response) => {
	const id = parseInt(req.params.id);
	if (isNaN(id)) throw new AppError("Invalid vessel ID", 400);

	const mstVesselRepo = new MstVesselRepository();

	const existingVessel = await mstVesselRepo.findVessel({ id });
	if (!existingVessel) throw new AppError("Vessel not found", 404);

	await mstVesselRepo.deleteVessel(id);

	return success(res, { message: "Vessel deleted successfully" });
});

export default {
	getMasterVessels,
	getVesselById,
	createVessel,
	updateVessel,
	deleteVessel,
};
