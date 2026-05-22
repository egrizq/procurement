import { relations } from "drizzle-orm/relations";
import { users, apiTokens, mocs, mocVendors, mstVendors, vesselRequests, vesselRequestItems, mstItemCategories, mstItems, mstVessels, vesselItemStandard, vesselStocks } from "./schema";

export const apiTokensRelations = relations(apiTokens, ({one}) => ({
	user: one(users, {
		fields: [apiTokens.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	apiTokens: many(apiTokens),
	mocs: many(mocs),
	mstVessel: one(mstVessels, {
		fields: [users.vesselId],
		references: [mstVessels.id]
	}),
	vesselRequests_requestedBy: many(vesselRequests, {
		relationName: "vesselRequests_requestedBy_users_id"
	}),
	vesselRequests_reviewedBy: many(vesselRequests, {
		relationName: "vesselRequests_reviewedBy_users_id"
	}),
}));

export const mocVendorsRelations = relations(mocVendors, ({one}) => ({
	moc: one(mocs, {
		fields: [mocVendors.mocId],
		references: [mocs.id]
	}),
	mstVendor: one(mstVendors, {
		fields: [mocVendors.vendorId],
		references: [mstVendors.id]
	}),
}));

export const mocsRelations = relations(mocs, ({one, many}) => ({
	mocVendors: many(mocVendors),
	user: one(users, {
		fields: [mocs.createdBy],
		references: [users.id]
	}),
	vesselRequest: one(vesselRequests, {
		fields: [mocs.vesselRequestId],
		references: [vesselRequests.id]
	}),
	vesselRequestItem: one(vesselRequestItems, {
		fields: [mocs.vesselRequestItemId],
		references: [vesselRequestItems.id]
	}),
}));

export const mstVendorsRelations = relations(mstVendors, ({many}) => ({
	mocVendors: many(mocVendors),
}));

export const vesselRequestsRelations = relations(vesselRequests, ({one, many}) => ({
	mocs: many(mocs),
	vesselRequestItems: many(vesselRequestItems),
	user_requestedBy: one(users, {
		fields: [vesselRequests.requestedBy],
		references: [users.id],
		relationName: "vesselRequests_requestedBy_users_id"
	}),
	user_reviewedBy: one(users, {
		fields: [vesselRequests.reviewedBy],
		references: [users.id],
		relationName: "vesselRequests_reviewedBy_users_id"
	}),
	mstVessel: one(mstVessels, {
		fields: [vesselRequests.vesselId],
		references: [mstVessels.id]
	}),
}));

export const vesselRequestItemsRelations = relations(vesselRequestItems, ({one, many}) => ({
	mocs: many(mocs),
	mstItem: one(mstItems, {
		fields: [vesselRequestItems.itemId],
		references: [mstItems.id]
	}),
	vesselRequest: one(vesselRequests, {
		fields: [vesselRequestItems.vesselRequestId],
		references: [vesselRequests.id]
	}),
}));

export const mstItemsRelations = relations(mstItems, ({one, many}) => ({
	mstItemCategory: one(mstItemCategories, {
		fields: [mstItems.categoryId],
		references: [mstItemCategories.id]
	}),
	vesselItemStandards: many(vesselItemStandard),
	vesselRequestItems: many(vesselRequestItems),
	vesselStocks: many(vesselStocks),
}));

export const mstItemCategoriesRelations = relations(mstItemCategories, ({many}) => ({
	mstItems: many(mstItems),
}));

export const mstVesselsRelations = relations(mstVessels, ({many}) => ({
	users: many(users),
	vesselItemStandards: many(vesselItemStandard),
	vesselRequests: many(vesselRequests),
	vesselStocks: many(vesselStocks),
}));

export const vesselItemStandardRelations = relations(vesselItemStandard, ({one}) => ({
	mstItem: one(mstItems, {
		fields: [vesselItemStandard.itemId],
		references: [mstItems.id]
	}),
	mstVessel: one(mstVessels, {
		fields: [vesselItemStandard.vesselId],
		references: [mstVessels.id]
	}),
}));

export const vesselStocksRelations = relations(vesselStocks, ({one}) => ({
	mstItem: one(mstItems, {
		fields: [vesselStocks.itemId],
		references: [mstItems.id]
	}),
	mstVessel: one(mstVessels, {
		fields: [vesselStocks.vesselId],
		references: [mstVessels.id]
	}),
}));