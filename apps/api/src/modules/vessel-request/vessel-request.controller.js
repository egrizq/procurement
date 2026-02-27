import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import MstItemRepository from '#modules/master-data/items/item.repository.js';
import MstVesselRepository from '#modules/master-data/vessels/vessel.repository.js';
import VesselRequestRepository from './vessel-request.repository.js';

const vesselRequestRepo = new VesselRequestRepository();
const mstItemRepo = new MstItemRepository();
const mstVesselRepo = new MstVesselRepository();

const create = asyncHandler(async (req, res) => {
	const vessel = await mstVesselRepo.findVessel({ id: req.body.vesselId });
	if (!vessel) {
		throw new AppError("Vessel is not found!", 400);
	}

	const itemIds = req.body.items.map((item) => item.itemId);

	const items = await mstItemRepo.findItemByIds(itemIds);
	if (!items || items.length !== req.body.items.length) {
		throw new AppError("One or more items are invalid!", 400);
	}

	const userId = req.apiToken.userId;
	if (!userId) {
		throw new AppError("Unauthorized user", 401);
	}

	const requestDate = new Date(req.body.requestDate);
	if (isNaN(requestDate.getTime())) {
		throw new AppError("Invalid request date format", 400);
	}

	const requestCode = `VR-${Date.now()}`;
	const bodyVesselRequest = {
		requestCode,
		requestedBy: userId,
		vesselId: req.body.vesselId,
		status: req.body.status,
		priority: req.body.priority,
		justification: req.body.justification,
		requestDate: requestDate,
	};
	const vesselRequest =
		await vesselRequestRepo.createVesselRequest(bodyVesselRequest);
	if (!vesselRequest) {
		throw new AppError("Failed to create vessel request", 500);
	}

	const vesselRequestItemsData = req.body.items.map((item) => ({
		vesselRequestId: vesselRequest.id,
		itemId: item.itemId,
		qtyRequested: item.qtyRequested,
		unit: item.unit,
		status: item.status,
		priority: item.priority,
		justification: item.justification,
	}));
	const vesselRequestItems = await vesselRequestRepo.createVesselRequestItems(
		vesselRequestItemsData,
	);
	if (!vesselRequestItems) {
		throw new AppError("Failed to create vessel request items", 500);
	}

	return success(res, { vesselRequest, vesselRequestItems }, 201);
});

const getAll = asyncHandler(async (req, res) => {
	const { limit = 10, page = 1, search = "" } = req.body;

	const vesselRequests = await vesselRequestRepo.getVesselRequests(
		page,
		limit,
		search,
	);
	if (!vesselRequests.items || vesselRequests.items.length === 0) {
		throw new AppError("Vessel requests not found", 404);
	}

	const pagination = getPaginationMeta(page, limit, vesselRequests.total);

	return success(
		res,
		{
			requests: vesselRequests.items,
			pagination,
			meta: {
				search: search || null,
				sort_by: "createdAt",
				sort_order: "desc",
				filters_applied: {},
			},
		},
		200,
	);
});

const getById = asyncHandler(async (req, res) => {
	let { id } = req.params;

	if (Number.isNaN(id)) {
		throw new AppError("Invalid vessel request ID", 400);
	}
	id = Number(id);

	const vesselRequest = await vesselRequestRepo.getVesselRequestById(id);
	if (!vesselRequest) {
		throw new AppError("Vessel request not found", 404);
	}

	return success(res, vesselRequest, 200);
});

const update = asyncHandler(async (req, res) => {
	let { id } = req.params;

	if (Number.isNaN(id)) {
		throw new AppError("Invalid vessel request ID", 400);
	}
	id = Number(id);

	const vesselRequest = await vesselRequestRepo.getVesselRequestById(id);
	if (!vesselRequest) {
		throw new AppError("Vessel request not found", 404);
	}
});

export default {
	create,
	getAll,
	getById,
	update,
};
