import db from "../../config/drizzle.ts";
import { auditLogs, users } from "../../db/schema/index.ts";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";
import type { AuditAction, AuditModule } from "../../shared/utils/auditLog.ts";

interface GetAuditLogsParams {
	page?: number;
	limit?: number;
	module?: AuditModule;
	action?: AuditAction;
	userId?: number;
	from?: Date;
	to?: Date;
}

class AuditLogRepository {
	async getAuditLogs({
		page = 1,
		limit = 20,
		module,
		action,
		userId,
		from,
		to,
	}: GetAuditLogsParams) {
		const conditions: any[] = [];

		if (module) conditions.push(eq(auditLogs.module, module));
		if (action) conditions.push(eq(auditLogs.action, action));
		if (userId) conditions.push(eq(auditLogs.userId, userId));
		if (from) conditions.push(gte(auditLogs.createdAt, from));
		if (to) conditions.push(lte(auditLogs.createdAt, to));

		const where =
			conditions.length === 0
				? undefined
				: conditions.length === 1
					? conditions[0]
					: and(...conditions);

		const offset = (page - 1) * limit;

		const [items, countResult] = await Promise.all([
			db.query.auditLogs.findMany({
				where,
				with: {
					user: {
						columns: { id: true, fullName: true, username: true, type: true },
					},
				},
				orderBy: [desc(auditLogs.createdAt)],
				limit,
				offset,
			}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(auditLogs)
				.where(where)
				.then((r) => Number(r[0]?.count || 0)),
		]);

		// Parse JSON fields
		const parsed = items.map((item) => {
			let beforeData = null;
			let afterData = null;
			try {
				if (item.beforeData) beforeData = JSON.parse(item.beforeData);
			} catch {}
			try {
				if (item.afterData) afterData = JSON.parse(item.afterData);
			} catch {}
			return { ...item, beforeData, afterData };
		});

		return { items: parsed, total: countResult };
	}

	async getAuditLogById(id: number) {
		const item = await db.query.auditLogs.findFirst({
			where: eq(auditLogs.id, id),
			with: {
				user: {
					columns: { id: true, fullName: true, username: true, type: true },
				},
			},
		});
		if (!item) return null;

		let beforeData = null;
		let afterData = null;
		try {
			if (item.beforeData) beforeData = JSON.parse(item.beforeData);
		} catch {}
		try {
			if (item.afterData) afterData = JSON.parse(item.afterData);
		} catch {}
		return { ...item, beforeData, afterData };
	}
}

export default AuditLogRepository;
