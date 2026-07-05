import {
	int,
	mysqlTable,
	mysqlEnum,
	timestamp,
	varchar,
	text,
	index,
	boolean,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { purchaseOrders } from "./purchase-orders";
import { users } from "./users";

export const grStatusEnum = ["Accepted", "Rejected"] as const;

export const goodReceipts = mysqlTable(
	"good_receipts",
	{
		id: int("id").primaryKey().autoincrement(),
		grNumber: varchar("gr_number", { length: 50 }).notNull().unique(),
		purchaseOrderId: int("purchase_order_id")
			.notNull()
			.references(() => purchaseOrders.id),
		isSameItem: boolean("is_same_item").notNull(),
		status: mysqlEnum("status", grStatusEnum).notNull(),
		discrepancyReason: text("discrepancy_reason"),
		attachments: text("attachments"),
		createdBy: int("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	},
	(table) => ({
		purchaseOrderIdIdx: index("idx_gr_po_id").on(table.purchaseOrderId),
		statusIdx: index("idx_gr_status").on(table.status),
		createdByIdx: index("idx_gr_created_by").on(table.createdBy),
	}),
);

export const goodReceiptsRelations = relations(goodReceipts, ({ one }) => ({
	purchaseOrder: one(purchaseOrders, {
		fields: [goodReceipts.purchaseOrderId],
		references: [purchaseOrders.id],
	}),
	createdByUser: one(users, {
		fields: [goodReceipts.createdBy],
		references: [users.id],
	}),
}));
