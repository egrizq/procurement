import type { Request } from "express";
import db from "#config/drizzle.ts";
import { auditLogs } from "../../db/schema/index.ts";

export type AuditAction =
	| "CREATE"
	| "UPDATE"
	| "DELETE"
	| "APPROVE"
	| "REJECT"
	| "REVIEW"
	| "SAW_SCORE"
	| "SAW_WEIGHT_REQUEST"
	| "SAW_WEIGHT_REVIEW";

export type AuditModule =
	| "vessel_request"
	| "moc"
	| "purchase_order"
	| "good_receipt";

export interface AuditLogParams {
	userId: number;
	action: AuditAction;
	module: AuditModule;
	entityId: number;
	entityCode?: string | null;
	description: string;
	beforeData?: object | null;
	afterData?: object | null;
	ipAddress?: string | null;
}

/**
 * Persist an audit log entry non-blocking.
 * Uses void + catch so it never interrupts the main request flow.
 */
export function createAuditLog(params: AuditLogParams): void {
	const task = db.insert(auditLogs).values({
		userId: params.userId,
		action: params.action,
		module: params.module,
		entityId: params.entityId,
		entityCode: params.entityCode ?? null,
		description: params.description,
		beforeData: params.beforeData ? JSON.stringify(params.beforeData) : null,
		afterData: params.afterData ? JSON.stringify(params.afterData) : null,
		ipAddress: params.ipAddress ?? null,
	});

	void task.catch((err) => {
		console.error("[AuditLog] Failed to write audit log:", err);
	});
}

/**
 * Helper to extract client IP from an Express Request.
 */
export function getClientIp(req: Request): string | null {
	const forwarded = req.headers["x-forwarded-for"];
	if (forwarded) {
		const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
		return first?.split(",")[0].trim() || null;
	}
	return req.socket?.remoteAddress || null;
}
