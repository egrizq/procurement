import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import AuditLogRepository from "./audit-log.repository.ts";
import type { AuditAction, AuditModule } from "#shared/utils/auditLog.ts";

const auditRepo = new AuditLogRepository();

/**
 * GET /audit-logs
 * Returns paginated audit logs with optional filters.
 * Query params: page, limit, module, action, userId, from, to
 */
const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
	const {
		page = 1,
		limit = 20,
		module,
		action,
		userId,
		from,
		to,
	} = req.query;

	const fromDate = from ? new Date(from as string) : undefined;
	const toDate = to ? new Date(to as string) : undefined;

	if (fromDate && isNaN(fromDate.getTime())) {
		throw new AppError("Invalid 'from' date format", 400);
	}
	if (toDate && isNaN(toDate.getTime())) {
		throw new AppError("Invalid 'to' date format", 400);
	}

	// If 'to' date is provided, set it to end of day
	if (toDate) {
		toDate.setHours(23, 59, 59, 999);
	}

	const result = await auditRepo.getAuditLogs({
		page: Number(page),
		limit: Number(limit),
		module: module as AuditModule | undefined,
		action: action as AuditAction | undefined,
		userId: userId ? Number(userId) : undefined,
		from: fromDate,
		to: toDate,
	});

	const pagination = getPaginationMeta(Number(page), Number(limit), result.total);

	return success(res, { auditLogs: result.items, pagination });
});

/**
 * GET /audit-logs/:id
 * Returns a single audit log entry with before/after data.
 */
const getAuditLogById = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (Number.isNaN(id)) throw new AppError("Invalid audit log ID", 400);

	const log = await auditRepo.getAuditLogById(id);
	if (!log) throw new AppError("Audit log not found", 404);

	return success(res, { auditLog: log });
});

export default {
	getAuditLogs,
	getAuditLogById,
};
