import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, primaryKey, unique, int, varchar, timestamp, serial, text, bigint, mysqlEnum, datetime, date } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const apiTokens = mysqlTable("api_tokens", {
	id: int().autoincrement().notNull(),
	deviceId: varchar("device_id", { length: 255 }).notNull(),
	deviceName: varchar("device_name", { length: 255 }),
	token: varchar({ length: 255 }).notNull(),
	userId: int("user_id").references(() => users.id),
	expiredAt: timestamp("expired_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	index("idx_device_user").on(table.deviceId, table.userId),
	primaryKey({ columns: [table.id], name: "api_tokens_id"}),
	unique("api_tokens_token_unique").on(table.token),
]);

export const migrations = mysqlTable("migrations", {
	id: serial().notNull(),
	hash: text().notNull(),
	createdAt: bigint("created_at", { mode: "number" }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "migrations_id"}),
	unique("id").on(table.id),
]);

export const mocVendors = mysqlTable("moc_vendors", {
	id: int().autoincrement().notNull(),
	mocId: int("moc_id").notNull().references(() => mocs.id, { onDelete: "cascade" } ),
	vendorId: int("vendor_id").notNull().references(() => mstVendors.id),
	unitPrice: int("unit_price").notNull(),
	leadTime: varchar("lead_time", { length: 100 }).notNull(),
	remarks: text(),
	isSelected: tinyint("is_selected").default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "moc_vendors_id"}),
]);

export const mocs = mysqlTable("mocs", {
	id: int().autoincrement().notNull(),
	vesselRequestId: int("vessel_request_id").notNull().references(() => vesselRequests.id),
	vesselRequestItemId: int("vessel_request_item_id").notNull().references(() => vesselRequestItems.id),
	status: mysqlEnum(['Draft','Completed']).default('Draft').notNull(),
	createdBy: int("created_by").notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "mocs_id"}),
]);

export const mstCity = mysqlTable("mst_city", {
	id: int().autoincrement().notNull(),
	cityName: varchar("city_name", { length: 255 }),
	createdAt: datetime("created_at", { mode: 'string'}).notNull(),
},
(table) => [
	index("o2o_master_city_city_name").on(table.cityName),
	index("o2o_master_city_id").on(table.id),
	primaryKey({ columns: [table.id], name: "mst_city_id"}),
]);

export const mstItemCategories = mysqlTable("mst_item_categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['Publish','Unpublish']).default('Publish').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "mst_item_categories_id"}),
]);

export const mstItems = mysqlTable("mst_items", {
	id: int().autoincrement().notNull(),
	itemCode: varchar("item_code", { length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	unit: mysqlEnum(['Pcs','Box','Liter','Meter','Kg']).notNull(),
	categoryId: int("category_id").notNull().references(() => mstItemCategories.id),
	status: mysqlEnum(['Publish','Unpublish']).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	index("idx_category_id").on(table.categoryId),
	index("idx_item_code").on(table.itemCode),
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "mst_items_id"}),
]);

export const mstVendors = mysqlTable("mst_vendors", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	category: mysqlEnum(['Jasa','Sparepart','Fuel','Engine']).notNull(),
	address: text(),
	phone: varchar({ length: 50 }),
	email: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "mst_vendors_id"}),
]);

export const mstVessels = mysqlTable("mst_vessels", {
	id: int().autoincrement().notNull(),
	imoNumber: varchar("imo_number", { length: 100 }),
	name: varchar({ length: 255 }).notNull(),
	flag: varchar({ length: 100 }),
	type: varchar({ length: 100 }),
	status: mysqlEnum(['Publish','Unpublish']).default('Publish').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	imgUrl: varchar("img_url", { length: 255 }),
},
(table) => [
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "mst_vessels_id"}),
]);

export const roleModules = mysqlTable("role_modules", {
	id: int().autoincrement().notNull(),
	userType: mysqlEnum("user_type", ['Admin','Staff','Manager','Crew']).notNull(),
	moduleSlug: varchar("module_slug", { length: 100 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "role_modules_id"}),
	unique("role_modules_type_slug_unique").on(table.userType, table.moduleSlug),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 255 }),
	type: mysqlEnum(['Admin','Staff','Manager','Crew']).notNull(),
	department: mysqlEnum(['IT','HR','Finance','Deck','Engine']).notNull(),
	vesselId: int("vessel_id").notNull().references(() => mstVessels.id),
	position: varchar({ length: 100 }),
	status: mysqlEnum(['Contract','Permanent','Intern','Leave']).default('Contract').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	leaveDate: date("leave_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	imgUrl: varchar("img_url", { length: 255 }),
},
(table) => [
	index("users_vessel_id_fkey").on(table.vesselId),
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const vesselItemStandard = mysqlTable("vessel_item_standard", {
	id: int().autoincrement().notNull(),
	vesselId: int("vessel_id").notNull().references(() => mstVessels.id),
	itemId: int("item_id").notNull().references(() => mstItems.id),
	periode: mysqlEnum(['weekly','monthly','quarterly']).notNull(),
	minStock: int("min_stock").notNull(),
	maxStock: int("max_stock").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	index("idx_item_id").on(table.itemId),
	index("idx_vessel_id").on(table.vesselId),
	primaryKey({ columns: [table.id], name: "vessel_item_standard_id"}),
]);

export const vesselRequestItems = mysqlTable("vessel_request_items", {
	id: int().autoincrement().notNull(),
	vesselRequestId: int("vessel_request_id").notNull().references(() => vesselRequests.id),
	itemId: int("item_id").notNull().references(() => mstItems.id),
	qtyRequested: int("qty_requested").notNull(),
	qtyApproved: int("qty_approved"),
	unit: mysqlEnum(['Pcs','Box','Liter','Meter','Kg']).notNull(),
	status: mysqlEnum(['Ok','Waiting','Approved','Rejected']).default('Waiting').notNull(),
	priority: mysqlEnum(['Low','Medium','High']).default('Medium').notNull(),
	justification: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	staffJustification: text("staff_justification"),
},
(table) => [
	index("idx_item_id").on(table.itemId),
	index("idx_vessel_request_id").on(table.vesselRequestId),
	primaryKey({ columns: [table.id], name: "vessel_request_items_id"}),
]);

export const vesselRequests = mysqlTable("vessel_requests", {
	id: int().autoincrement().notNull(),
	requestCode: varchar("request_code", { length: 100 }).notNull(),
	requestedBy: int("requested_by").notNull().references(() => users.id),
	vesselId: int("vessel_id").notNull().references(() => mstVessels.id),
	status: mysqlEnum(['Ok','Waiting','Approved','Rejected']).default('Waiting').notNull(),
	priority: mysqlEnum(['Low','Medium','High']).default('Medium').notNull(),
	justification: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	requestDate: date("request_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewedBy: int("reviewed_by").references(() => users.id),
	rejectReason: text("reject_reason"),
},
(table) => [
	index("idx_status").on(table.status),
	index("idx_vessel_id").on(table.vesselId),
	index("vessel_requests_requested_by_fkey").on(table.requestedBy),
	index("vessel_requests_reviewed_by_fkey").on(table.reviewedBy),
	primaryKey({ columns: [table.id], name: "vessel_requests_id"}),
]);

export const vesselStocks = mysqlTable("vessel_stocks", {
	id: int().autoincrement().notNull(),
	vesselId: int("vessel_id").notNull().references(() => mstVessels.id),
	itemId: int("item_id").notNull().references(() => mstItems.id),
	stockOnHand: int("stock_on_hand").notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastUpdate: date("last_update", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	index("idx_item_id").on(table.itemId),
	index("idx_vessel_id").on(table.vesselId),
	primaryKey({ columns: [table.id], name: "vessel_stocks_id"}),
]);
