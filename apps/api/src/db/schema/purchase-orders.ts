import {
	int,
	mysqlTable,
	mysqlEnum,
	timestamp,
	varchar,
	decimal,
	text,
	index,
	foreignKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { mocs } from "./moc";
import { mstVendors } from "./vendors";
import { vesselRequestItems } from "./vessel-requests";
import { users } from "./users";

export const poStatusEnum = [
	"Auto Approved",
	"Pending Approval",
	"Approved",
	"Rejected",
] as const;

export const purchaseOrders = mysqlTable(
	"purchase_orders",
	{
		id: int("id").primaryKey().autoincrement(),
		poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
		mocId: int("moc_id")
			.notNull()
			.references(() => mocs.id),
		vendorId: int("vendor_id")
			.notNull()
			.references(() => mstVendors.id),
		vesselRequestItemId: int("vessel_request_item_id").notNull(),
		unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
		qty: int("qty").notNull(),
		totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
		status: mysqlEnum("status", poStatusEnum)
			.default("Pending Approval")
			.notNull(),
		notes: text("notes"),
		approvedBy: int("approved_by").references(() => users.id),
		approvedAt: timestamp("approved_at"),
		rejectionReason: text("rejection_reason"),
		createdBy: int("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	},
	(table) => ({
		mocIdIdx: index("idx_po_moc_id").on(table.mocId),
		vendorIdIdx: index("idx_po_vendor_id").on(table.vendorId),
		statusIdx: index("idx_po_status").on(table.status),
		createdByIdx: index("idx_po_created_by").on(table.createdBy),
		vesselRequestItemFk: foreignKey({
			name: "po_vr_item_fk",
			columns: [table.vesselRequestItemId],
			foreignColumns: [vesselRequestItems.id],
		}),
	}),
);

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
	moc: one(mocs, {
		fields: [purchaseOrders.mocId],
		references: [mocs.id],
	}),
	vendor: one(mstVendors, {
		fields: [purchaseOrders.vendorId],
		references: [mstVendors.id],
	}),
	vesselRequestItem: one(vesselRequestItems, {
		fields: [purchaseOrders.vesselRequestItemId],
		references: [vesselRequestItems.id],
	}),
	createdByUser: one(users, {
		fields: [purchaseOrders.createdBy],
		references: [users.id],
		relationName: "po_created_by",
	}),
	approvedByUser: one(users, {
		fields: [purchaseOrders.approvedBy],
		references: [users.id],
		relationName: "po_approved_by",
	}),
}));
