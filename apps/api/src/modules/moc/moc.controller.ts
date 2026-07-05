import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import MocRepository from "./moc.repository.ts";
import {
	notifyUsersByType,
	createNotification,
} from "#shared/utils/notificationService.ts";
import { createAuditLog, getClientIp } from "#shared/utils/auditLog.ts";
import db from "#config/drizzle.ts";
import { users } from "../../db/schema/index.ts";
import { eq } from "drizzle-orm";

const createMoc = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const data = req.body;

	const mocRepo = new MocRepository();
	const newMoc = await mocRepo.createMoc(data, userId);

	if (newMoc) {
		// Notify managers/admins that a new MOC has been created
		await notifyUsersByType(["Manager", "Admin"], {
			type: "moc_created",
			title: "New MOC Created",
			message: `A new Material Order Comparison (MOC #${newMoc.id}) has been created and requires attention.`,
			entityType: "moc",
			entityId: newMoc.id,
		});

		// Audit log
		createAuditLog({
			userId,
			action: "CREATE",
			module: "moc",
			entityId: newMoc.id,
			entityCode: `MOC-${newMoc.id}`,
			description: `MOC #${newMoc.id} dibuat dengan status '${data.status || "Draft"}'.`,
			afterData: { status: data.status || "Draft", vesselRequestId: data.vesselRequestId, vendorCount: data.vendors?.length },
			ipAddress: getClientIp(req),
		});
	}

	return success(res, { moc: newMoc }, 201);
});

const getMocs = asyncHandler(async (req: Request, res: Response) => {
	const { page = 1, limit = 10, search = "", status } = req.body;

	const mocRepo = new MocRepository();
	const result = await mocRepo.getMocs(
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

	return success(res, {
		mocs: result.items,
		pagination,
	});
});

const getMocById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;

	const mocRepo = new MocRepository();
	const moc = await mocRepo.getMocById(Number(id));

	if (!moc) {
		throw new AppError("MOC not found", 404);
	}

	return success(res, { moc });
});

const updateMoc = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const data = req.body;
	const userId = req.apiToken!.userId;

	const mocRepo = new MocRepository();
	const before = await mocRepo.getMocById(Number(id));
	const updatedMoc = await mocRepo.updateMoc(Number(id), data);

	// Audit log
	createAuditLog({
		userId,
		action: "UPDATE",
		module: "moc",
		entityId: Number(id),
		entityCode: `MOC-${id}`,
		description: `MOC #${id} diperbarui. Status: '${data.status}'.`,
		beforeData: { status: before?.status, selectedVendorId: before?.selectedVendorId },
		afterData: { status: data.status, selectedVendorId: data.selectedVendorId ?? null },
		ipAddress: getClientIp(req),
	});

	return success(res, { moc: updatedMoc });
});

const deleteMoc = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const userId = req.apiToken!.userId;

	const mocRepo = new MocRepository();
	const before = await mocRepo.getMocById(Number(id));
	await mocRepo.deleteMoc(Number(id));

	// Audit log
	createAuditLog({
		userId,
		action: "DELETE",
		module: "moc",
		entityId: Number(id),
		entityCode: `MOC-${id}`,
		description: `MOC #${id} dihapus.`,
		beforeData: before ? { status: before.status, vesselRequestId: before.vesselRequestId } : null,
		ipAddress: getClientIp(req),
	});

	return success(res, { message: "MOC deleted successfully" });
});

const scoreMoc = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const userId = req.apiToken!.userId;

	const mocRepo = new MocRepository();
	try {
		const result = await mocRepo.scoreMoc(Number(id));

		// Audit log
		createAuditLog({
			userId,
			action: "SAW_SCORE",
			module: "moc",
			entityId: Number(id),
			entityCode: `MOC-${id}`,
			description: `Perhitungan SAW dijalankan pada MOC #${id}. Terpilih vendor ID: ${result.breakdown.vendors.find((v: any) => v.isSelected)?.vendorId ?? "N/A"}.`,
			afterData: {
				weights: result.breakdown.weights,
				ranking: result.breakdown.vendors.map((v: any) => ({ vendorId: v.vendorId, sawScore: v.sawScore, rank: v.rank, isSelected: v.isSelected })),
			},
			ipAddress: getClientIp(req),
		});

		return success(res, result);
	} catch (err: any) {
		throw new AppError(err.message || "Failed to calculate SAW score", 400);
	}
});

const submitSawWeightRequest = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const userId = req.apiToken!.userId;
	const { unitPriceWeight, availableQtyWeight, warrantyWeight, discountWeight, reason } =
		req.body;

	const mocRepo = new MocRepository();
	try {
		const request = await mocRepo.submitSawWeightRequest(Number(id), userId, {
			unitPriceWeight,
			availableQtyWeight,
			warrantyWeight,
			discountWeight,
			reason,
		});

		await notifyUsersByType(["Manager"], {
			type: "moc_saw_weight_request_submitted",
			title: "SAW Weight Adjustment Requested",
			message: `A custom SAW weight set has been proposed for MOC #${id} and needs your review.`,
			entityType: "moc_saw_weight_request",
			entityId: request!.id,
		});

		createAuditLog({
			userId,
			action: "SAW_WEIGHT_REQUEST",
			module: "moc",
			entityId: Number(id),
			entityCode: `MOC-${id}`,
			description: `Permintaan perubahan bobot SAW diajukan untuk MOC #${id}.`,
			afterData: {
				unitPriceWeight,
				availableQtyWeight,
				warrantyWeight,
				discountWeight,
				reason: reason ?? null,
			},
			ipAddress: getClientIp(req),
		});

		return success(res, { sawWeightRequest: request }, 201);
	} catch (err: any) {
		throw new AppError(err.message || "Failed to submit SAW weight request", 400);
	}
});

const reviewSawWeightRequest = asyncHandler(async (req: Request, res: Response) => {
	const { requestId } = req.params;
	const userId = req.apiToken!.userId;
	const { action, rejectReason } = req.body;

	const actingUser = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { type: true },
	});
	if (actingUser?.type !== "Manager") {
		throw new AppError("Only Managers can review SAW weight requests", 403);
	}

	const mocRepo = new MocRepository();
	try {
		const { request, mocId, requesterUserId } = await mocRepo.reviewSawWeightRequest(
			Number(requestId),
			userId,
			action,
			rejectReason,
		);

		const isApproved = action === "Approve";
		if (requesterUserId) {
			await createNotification({
				userId: requesterUserId,
				type: isApproved
					? "moc_saw_weight_request_approved"
					: "moc_saw_weight_request_rejected",
				title: isApproved ? "SAW Weight Request Approved" : "SAW Weight Request Rejected",
				message: isApproved
					? `Your proposed SAW weights for MOC #${mocId} have been approved. Re-run scoring to apply them.`
					: `Your proposed SAW weights for MOC #${mocId} were rejected. Reason: ${rejectReason ?? "N/A"}.`,
				entityType: "moc_saw_weight_request",
				entityId: request!.id,
			});
		}

		createAuditLog({
			userId,
			action: "SAW_WEIGHT_REVIEW",
			module: "moc",
			entityId: mocId,
			entityCode: `MOC-${mocId}`,
			description: `Permintaan bobot SAW untuk MOC #${mocId} di-review: '${action}'${rejectReason ? ` (Alasan: ${rejectReason})` : ""}.`,
			afterData: { action, rejectReason: rejectReason ?? null },
			ipAddress: getClientIp(req),
		});

		return success(res, { sawWeightRequest: request });
	} catch (err: any) {
		throw new AppError(err.message || "Failed to review SAW weight request", 400);
	}
});

export default {
	createMoc,
	getMocs,
	getMocById,
	updateMoc,
	deleteMoc,
	scoreMoc,
	submitSawWeightRequest,
	reviewSawWeightRequest,
};
