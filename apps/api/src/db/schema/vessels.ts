import {
	int,
	mysqlTable,
	mysqlEnum,
	timestamp,
	varchar,
	index,
} from "drizzle-orm/mysql-core";
import { statusEnum } from "./enums";

export const mstVessels = mysqlTable(
	"mst_vessels",
	{
		id: int("id").primaryKey().autoincrement(),
		imoNumber: varchar("imo_number", { length: 100 }),
		name: varchar("name", { length: 255 }).notNull(),
		flag: varchar("flag", { length: 100 }),
		type: varchar("type", { length: 100 }),
		status: mysqlEnum("status", statusEnum).default("Publish").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
		imgUrl: varchar("img_url", { length: 255 }),
	},
	(table) => ({
		idxStatus: index("idx_status").on(table.status),
	}),
);
