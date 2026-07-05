import {
	int,
	mysqlTable,
	mysqlEnum,
	timestamp,
	varchar,
	text,
	index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const auditActionEnum = [
	"CREATE",
	"UPDATE",
	"DELETE",
	"APPROVE",
	"REJECT",
	"REVIEW",
	"SAW_SCORE",
	"SAW_WEIGHT_REQUEST",
	"SAW_WEIGHT_REVIEW",
] as const;

export const auditModuleEnum = [
	"vessel_request",
	"moc",
	"purchase_order",
	"good_receipt",
] as const;

export const auditLogs = mysqlTable(
	"audit_logs",
	{
		id: int("id").primaryKey().autoincrement(),
		userId: int("user_id")
			.notNull()
			.references(() => users.id),
		action: mysqlEnum("action", auditActionEnum).notNull(),
		module: mysqlEnum("module", auditModuleEnum).notNull(),
		entityId: int("entity_id").notNull(),
		entityCode: varchar("entity_code", { length: 100 }),
		description: text("description").notNull(),
		beforeData: text("before_data"),
		afterData: text("after_data"),
		ipAddress: varchar("ip_address", { length: 45 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("idx_audit_user_id").on(table.userId),
		moduleIdx: index("idx_audit_module").on(table.module),
		actionIdx: index("idx_audit_action").on(table.action),
		createdAtIdx: index("idx_audit_created_at").on(table.createdAt),
		entityIdx: index("idx_audit_entity").on(table.module, table.entityId),
	}),
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id],
	}),
}));
