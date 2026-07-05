import {
	int,
	mysqlTable,
	mysqlEnum,
	timestamp,
	text,
	boolean,
	decimal,
	index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { vesselRequests, vesselRequestItems } from "./vessel-requests";
import { mstVendors } from "./vendors";
import { users } from "./users";
import { purchaseOrders } from "./purchase-orders";

export const mocStatusEnum = ["Draft", "Completed", "Approved"] as const;
export const sawWeightRequestStatusEnum = [
	"Pending",
	"Approved",
	"Rejected",
] as const;

export const mocs = mysqlTable("mocs", {
	id: int("id").primaryKey().autoincrement(),
	vesselRequestId: int("vessel_request_id")
		.notNull()
		.references(() => vesselRequests.id),
	vesselRequestItemId: int("vessel_request_item_id")
		.notNull()
		.references(() => vesselRequestItems.id),
	status: mysqlEnum("status", mocStatusEnum).default("Draft").notNull(),
	selectedVendorId: int("selected_vendor_id").references(() => mstVendors.id),
	activeSawWeightRequestId: int("active_saw_weight_request_id"),
	createdBy: int("created_by")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const mocVendors = mysqlTable("moc_vendors", {
	id: int("id").primaryKey().autoincrement(),
	mocId: int("moc_id")
		.notNull()
		.references(() => mocs.id, { onDelete: "cascade" }),
	vendorId: int("vendor_id")
		.notNull()
		.references(() => mstVendors.id),
	unitPrice: int("unit_price").notNull(),
	availableQty: int("available_qty").notNull().default(0),
	warranty: int("warranty").notNull().default(0),
	discount: int("discount").notNull().default(0),
	sawScore: decimal("saw_score", { precision: 10, scale: 4 }),
	remarks: text("remarks"),
	isSelected: boolean("is_selected").default(false).notNull(),
});

export const mocSawWeightRequests = mysqlTable(
	"moc_saw_weight_requests",
	{
		id: int("id").primaryKey().autoincrement(),
		mocId: int("moc_id")
			.notNull()
			.references(() => mocs.id, { onDelete: "cascade" }),
		unitPriceWeight: decimal("unit_price_weight", {
			precision: 5,
			scale: 4,
		}).notNull(),
		availableQtyWeight: decimal("available_qty_weight", {
			precision: 5,
			scale: 4,
		}).notNull(),
		warrantyWeight: decimal("warranty_weight", {
			precision: 5,
			scale: 4,
		}).notNull(),
		discountWeight: decimal("discount_weight", {
			precision: 5,
			scale: 4,
		}).notNull(),
		reason: text("reason"),
		status: mysqlEnum("status", sawWeightRequestStatusEnum)
			.default("Pending")
			.notNull(),
		requestedBy: int("requested_by")
			.notNull()
			.references(() => users.id),
		requestedAt: timestamp("requested_at").defaultNow().notNull(),
		reviewedBy: int("reviewed_by").references(() => users.id),
		reviewedAt: timestamp("reviewed_at"),
		rejectReason: text("reject_reason"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	},
	(table) => ({
		mocIdIdx: index("idx_saw_weight_req_moc_id").on(table.mocId),
		statusIdx: index("idx_saw_weight_req_status").on(table.status),
		requestedByIdx: index("saw_weight_req_requested_by_fkey").on(
			table.requestedBy,
		),
		reviewedByIdx: index("saw_weight_req_reviewed_by_fkey").on(
			table.reviewedBy,
		),
	}),
);

export const mocsRelations = relations(mocs, ({ one, many }) => ({
	vesselRequest: one(vesselRequests, {
		fields: [mocs.vesselRequestId],
		references: [vesselRequests.id],
	}),
	vesselRequestItem: one(vesselRequestItems, {
		fields: [mocs.vesselRequestItemId],
		references: [vesselRequestItems.id],
	}),
	user: one(users, {
		fields: [mocs.createdBy],
		references: [users.id],
	}),
	selectedVendor: one(mstVendors, {
		fields: [mocs.selectedVendorId],
		references: [mstVendors.id],
	}),
	activeSawWeightRequest: one(mocSawWeightRequests, {
		fields: [mocs.activeSawWeightRequestId],
		references: [mocSawWeightRequests.id],
	}),
	mocVendors: many(mocVendors),
	purchaseOrders: many(purchaseOrders),
	sawWeightRequests: many(mocSawWeightRequests),
}));

export const mocVendorsRelations = relations(mocVendors, ({ one }) => ({
	moc: one(mocs, {
		fields: [mocVendors.mocId],
		references: [mocs.id],
	}),
	vendor: one(mstVendors, {
		fields: [mocVendors.vendorId],
		references: [mstVendors.id],
	}),
}));

export const mocSawWeightRequestsRelations = relations(
	mocSawWeightRequests,
	({ one }) => ({
		moc: one(mocs, {
			fields: [mocSawWeightRequests.mocId],
			references: [mocs.id],
		}),
		requester: one(users, {
			fields: [mocSawWeightRequests.requestedBy],
			references: [users.id],
			relationName: "saw_weight_req_requested_byTousers",
		}),
		reviewer: one(users, {
			fields: [mocSawWeightRequests.reviewedBy],
			references: [users.id],
			relationName: "saw_weight_req_reviewed_byTousers",
		}),
	}),
);
