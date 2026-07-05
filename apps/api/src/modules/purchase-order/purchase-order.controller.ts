import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import PurchaseOrderRepository from "./purchase-order.repository.ts";
import db from "../../config/drizzle";
import { mocs } from "../../db/schema/index.ts";
import { eq } from "drizzle-orm";
import { generatePurchaseOrderPdf } from "./purchase-order.pdf.ts";
import {
	notifyUsersByType,
	createNotification,
} from "#shared/utils/notificationService.ts";
import { createAuditLog, getClientIp } from "#shared/utils/auditLog.ts";

const poRepo = new PurchaseOrderRepository();

const createPO = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const { mocId, vendorId, vesselRequestItemId, unitPrice, qty, notes } =
		req.body;

	// Fetch MOC to get item info for threshold check
	const moc = await db.query.mocs.findFirst({
		where: eq(mocs.id, mocId),
		with: { vesselRequestItem: { with: { item: { columns: { id: true } } } } },
	});
	if (!moc) throw new AppError("MOC not found", 404);
	if (moc.status === "Approved")
		throw new AppError("A Purchase Order already exists for this MOC", 400);

	const itemId = moc.vesselRequestItem?.item?.id;
	if (!itemId) throw new AppError("Could not resolve item from MOC", 400);

	try {
		const po = await poRepo.createPO({
			mocId,
			vendorId,
			vesselRequestItemId,
			unitPrice,
			qty,
			notes,
			itemId,
			createdBy: userId,
		});

		// Notify managers/admins about the new PO
		await notifyUsersByType(["Manager", "Admin"], {
			type: "purchase_order_created",
			title: "New Purchase Order",
			message: `Purchase Order ${po?.poNumber} has been created and requires approval.`,
			entityType: "purchase_order",
			...(po?.id !== undefined ? { entityId: po.id } : {}),
		});

		// Audit log
		if (po?.id) {
			createAuditLog({
				userId,
				action: "CREATE",
				module: "purchase_order",
				entityId: po.id,
				entityCode: po.poNumber,
				description: `Purchase Order ${po.poNumber} dibuat untuk MOC #${mocId}.`,
				afterData: { poNumber: po.poNumber, status: po.status, vendorId, unitPrice, qty, mocId },
				ipAddress: getClientIp(req),
			});
		}

		return success(res, { purchaseOrder: po }, 201);
	} catch (err: any) {
		throw new AppError(err.message || "Failed to create Purchase Order", 400);
	}
});

const getPOs = asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 10, search = "", status } = req.body;

	const result = await poRepo.getPOs(
		Number(page),
		Number(limit),
		search,
		status,
	);
	const pagination = getPaginationMeta(
		Number(page),
		Number(limit),
		result.total,
	);

	return success(res, { purchaseOrders: result.items, pagination });
});

const getPOById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const po = await poRepo.getPOById(Number(id));
	if (!po) throw new AppError("Purchase Order not found", 404);
	return success(res, { purchaseOrder: po });
});

const approvePO = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const { id } = req.params;

	try {
		const po = await poRepo.approvePO(Number(id), userId);

		// Notify the PO creator
		const creatorId = po?.createdByUser?.id;
		if (creatorId) {
			await createNotification({
				userId: creatorId,
				type: "purchase_order_approved",
				title: "Purchase Order Approved",
				message: `Purchase Order ${po.poNumber} has been approved.`,
				entityType: "purchase_order",
				entityId: po.id,
			});
		}

		// Audit log
		createAuditLog({
			userId,
			action: "APPROVE",
			module: "purchase_order",
			entityId: po.id,
			entityCode: po.poNumber,
			description: `Purchase Order ${po.poNumber} disetujui.`,
			beforeData: { status: "Pending Approval" },
			afterData: { status: po.status },
			ipAddress: getClientIp(req),
		});

		return success(res, { purchaseOrder: po });
	} catch (err: any) {
		throw new AppError(err.message || "Failed to approve Purchase Order", 400);
	}
});

const rejectPO = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const { id } = req.params;
	const { rejectionReason } = req.body;

	try {
		const po = await poRepo.rejectPO(Number(id), userId, rejectionReason);

		// Notify the PO creator
		const creatorId = po?.createdByUser?.id;
		if (creatorId) {
			await createNotification({
				userId: creatorId,
				type: "purchase_order_rejected",
				title: "Purchase Order Rejected",
				message: `Purchase Order ${po.poNumber} was rejected. Reason: ${rejectionReason ?? "N/A"}.`,
				entityType: "purchase_order",
				entityId: po.id,
			});
		}

		// Audit log
		createAuditLog({
			userId,
			action: "REJECT",
			module: "purchase_order",
			entityId: po.id,
			entityCode: po.poNumber,
			description: `Purchase Order ${po.poNumber} ditolak. Alasan: ${rejectionReason ?? "N/A"}.`,
			beforeData: { status: "Pending Approval" },
			afterData: { status: po.status, rejectionReason: rejectionReason ?? null },
			ipAddress: getClientIp(req),
		});

		return success(res, { purchaseOrder: po });
	} catch (err: any) {
		throw new AppError(err.message || "Failed to reject Purchase Order", 400);
	}
});

const generatePdf = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (Number.isNaN(id)) {
		throw new AppError("Invalid purchase order ID", 400);
	}

	const po = await poRepo.getPOById(id);
	if (!po) {
		throw new AppError("Purchase Order not found", 404);
	}

	const pdfBuffer = await generatePurchaseOrderPdf(po);

	res.setHeader("Content-Type", "application/pdf");
	res.setHeader(
		"Content-Disposition",
		`attachment; filename=PurchaseOrder-${po.poNumber}.pdf`,
	);

	res.send(pdfBuffer);
});

export default {
	createPO,
	getPOs,
	getPOById,
	approvePO,
	rejectPO,
	generatePdf,
};
