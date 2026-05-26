import {
	int,
	mysqlTable,
	mysqlEnum,
	timestamp,
	index,
	decimal,
} from "drizzle-orm/mysql-core";
import { mstVessels } from "./vessels";
import { mstItems } from "./items";
import { periodEnum } from "./enums";
import { relations } from "drizzle-orm";

export const vesselItemStandards = mysqlTable(
	"vessel_item_standard",
	{
		id: int("id").primaryKey().autoincrement(),
		vesselId: int("vessel_id")
			.notNull()
			.references(() => mstVessels.id),
		itemId: int("item_id")
			.notNull()
			.references(() => mstItems.id),
		periode: mysqlEnum("periode", periodEnum).notNull(),
		minStock: int("min_stock").notNull(),
		maxStock: int("max_stock").notNull(),
		poThreshold: decimal("po_threshold", { precision: 15, scale: 2 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	},
	(table) => ({
		vesselIdx: index("idx_vessel_id").on(table.vesselId),
		itemIdx: index("idx_item_id").on(table.itemId),
	}),
);

export const vesselItemStandardsRelations = relations(
	vesselItemStandards,
	({ one }) => ({
		vessel: one(mstVessels, {
			fields: [vesselItemStandards.vesselId],
			references: [mstVessels.id],
		}),
		item: one(mstItems, {
			fields: [vesselItemStandards.itemId],
			references: [mstItems.id],
		}),
	}),
);
