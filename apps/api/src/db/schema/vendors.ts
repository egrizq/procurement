import {
	int,
	mysqlTable,
	mysqlEnum,
	timestamp,
	varchar,
	text,
} from "drizzle-orm/mysql-core";
import { categoryVendorEnum } from "./enums";

export const mstVendors = mysqlTable("mst_vendors", {
	id: int("id").primaryKey().autoincrement(),
	name: varchar("name", { length: 255 }).notNull(),
	category: mysqlEnum("category", categoryVendorEnum).notNull(),
	address: text("address"),
	phone: varchar("phone", { length: 50 }),
	email: varchar("email", { length: 100 }),
	city: varchar("city", { length: 100 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
