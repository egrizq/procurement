import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import MstItemRepository from '#modules/master-data/items/item.repository.ts';
import MstVesselRepository from '#modules/master-data/vessels/vessel.repository.ts';
import VesselRequestRepository from './vessel-request.repository.ts';

const vesselRequestRepo = new VesselRequestRepository();
const mstItemRepo = new MstItemRepository();
const mstVesselRepo = new MstVesselRepository();

const create = asyncHandler(async (req: Request, res: Response) => {
	const vessel = await mstVesselRepo.findVessel({ id: req.body.vesselId });
	if (!vessel) {
		throw new AppError('Vessel is not found!', 400);
	}

	const itemIds = req.body.items.map((item: any) => item.itemId);

	const items = await mstItemRepo.findItemByIds(itemIds);
	if (!items || items.length !== req.body.items.length) {
		throw new AppError('One or more items are invalid!', 400);
	}

	const userId = req.apiToken!.userId;
	if (!userId) {
		throw new AppError('Unauthorized user', 401);
	}

	const requestDate = new Date(req.body.requestDate);
	if (isNaN(requestDate.getTime())) {
		throw new AppError('Invalid request date format', 400);
	}

	const requestCode = `VR-${Date.now()}`;
	const bodyVesselRequest = {
		requestCode,
		user: { connect: { id: userId } },
		vessel: { connect: { id: req.body.vesselId } },
		status: req.body.status,
		priority: req.body.priority,
		justification: req.body.justification,
		requestDate: requestDate,
	};
	const vesselRequest =
		await vesselRequestRepo.createVesselRequest(bodyVesselRequest);
	if (!vesselRequest) {
		throw new AppError('Failed to create vessel request', 500);
	}

	const vesselRequestItemsData = req.body.items.map((item: any) => ({
		vesselRequestId: vesselRequest.id,
		itemId: item.itemId,
		qtyRequested: item.qtyRequested,
		unit: item.unit,
		status: item.status,
		priority: item.priority,
		justification: item.justification,
	}));
	const vesselRequestItems = await vesselRequestRepo.createVesselRequestItems(
		vesselRequestItemsData
	);
	if (!vesselRequestItems) {
		throw new AppError('Failed to create vessel request items', 500);
	}

	return success(res, { vesselRequest, vesselRequestItems }, 201);
});

const getAll = asyncHandler(async (req: Request, res: Response) => {
	const { limit = 10, page = 1, search = '' } = req.body;

	const vesselRequests = await vesselRequestRepo.getVesselRequests(
		page,
		limit,
		search
	);
	if (!vesselRequests.items || vesselRequests.items.length === 0) {
		throw new AppError('Vessel requests not found', 404);
	}

	const pagination = getPaginationMeta(page, limit, vesselRequests.total);

	return success(
		res,
		{
			requests: vesselRequests.items,
			pagination,
			meta: {
				search: search || null,
				sort_by: 'createdAt',
				sort_order: 'desc',
				filters_applied: {},
			},
		},
		200
	);
});

const getById = asyncHandler(async (req: Request, res: Response) => {
	let id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError('Invalid vessel request ID', 400);
	}

	const vesselRequest = await vesselRequestRepo.getVesselRequestById(id);
	if (!vesselRequest) {
		throw new AppError('Vessel request not found', 404);
	}

	return success(res, vesselRequest, 200);
});

const update = asyncHandler(async (req: Request, _res: Response) => {
	let id = Number(req.params.id);

	if (Number.isNaN(id)) {
		throw new AppError('Invalid vessel request ID', 400);
	}

	const vesselRequest = await vesselRequestRepo.getVesselRequestById(id);
	if (!vesselRequest) {
		throw new AppError('Vessel request not found', 404);
	}
});

const validate = asyncHandler(async (req: Request, res: Response) => {
        const vesselId = req.body.vesselId;
        const vessel = await mstVesselRepo.findVessel({ id: vesselId });
        if (!vessel) {
                throw new AppError('Vessel is not found!', 400);
        }

        const requestItems = req.body.items;
        const itemIds = requestItems.map((item: any) => item.itemId);

        const items = await mstItemRepo.findItemByIds(itemIds);
        if (!items || items.length !== requestItems.length) {
                throw new AppError('One or more items are invalid!', 400);
        }

        const inactiveItems = items.filter(i => i.status !== 'Publish');
        if (inactiveItems.length > 0) {
                const names = inactiveItems.map(i => i.name).join(', ');
                throw new AppError(`Cannot request inactive items: ${names}`, 400);
        }

        const [historyList, standardsList, stocksList] = await Promise.all([
                vesselRequestRepo.findRecentRequestedItems(vesselId, itemIds, 30),
                vesselRequestRepo.getVesselItemStandards(vesselId, itemIds),
                vesselRequestRepo.getVesselStocks(vesselId, itemIds)
        ]);

        const historyByItem = historyList.reduce((acc: any, curr: any) => {
                if (!acc[curr.itemId]) acc[curr.itemId] = [];
                acc[curr.itemId].push(curr);
                return acc;
        }, {});

        const standardByItem = standardsList.reduce((acc: any, curr: any) => {
                acc[curr.itemId] = curr;
                return acc;
        }, {});

        const stockByItem = stocksList.reduce((acc: any, curr: any) => {
                acc[curr.itemId] = curr;
                return acc;
        }, {});

        const validations = requestItems.map((reqItem: any) => {
                const warnings: string[] = [];
                const itemMaster = items.find(i => i.id === reqItem.itemId);
                const itemName = itemMaster?.name || `Item #${reqItem.itemId}`;

                const history = historyByItem[reqItem.itemId];
                if (history && history.length > 0) {
                        const mostRecent = history[0];
                        const dateStr = mostRecent.requestDate.toISOString().split('T')[0];
                        warnings.push(`Item ini baru saja diajukan pada request ${mostRecent.requestCode} tanggal ${dateStr}.`);
                }

                const standard = standardByItem[reqItem.itemId];
                const stock = stockByItem[reqItem.itemId];
                console.log('Standard:', standard, 'Stock:', stock);
                if (!standard) {
                        warnings.push(`Item tidak terdaftar pada standard kapal ini.`);
                } else {
                        const stockOnHand = stock ? stock.stockOnHand : 0;
                        if (reqItem.qtyRequested + stockOnHand > standard.maxStock) {
                                warnings.push(`Request melebihi kapasitas standar simpan batas maksimum (${standard.maxStock}).`);
                        }
                }

                if (reqItem.priority === 'High' && standard && stock) {
                        if (stock.stockOnHand > standard.minStock) {
                                warnings.push(`Stok aktual (${stock.stockOnHand}) masih di atas batas minimal, disarankan Priority Medium/Low.`);
                        }
                }

                if (stock && stock.lastUpdate) {
                        const diffTime = Math.abs(new Date().getTime() - new Date(stock.lastUpdate).getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 30) {
                                const dateStr = new Date(stock.lastUpdate).toISOString().split('T')[0];
                                warnings.push(`Laporan stok terakhir diupdate pada ${dateStr} (Lebih dari 30 hari). Harap update stok aktual terlebih dahulu.`);
                        }
                } else if (!stock) {
                        warnings.push(`Belum ada data laporan stok untuk item ini pada kapal. Harap update stok aktual.`);
                }

                return {
                        itemId: reqItem.itemId,
                        itemName,
                        warnings
                };
        });

        return success(res, { items: validations, header: [] }, 200);
});

export default {
        create,
        getAll,
        getById,
        update,
        validate,
};
