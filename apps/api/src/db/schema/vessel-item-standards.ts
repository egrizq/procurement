import { int, mysqlTable, mysqlEnum, timestamp, index } from 'drizzle-orm/mysql-core';
import { mstVessels } from './vessels';
import { mstItems } from './items';
import { periodEnum } from './enums';
import { relations } from 'drizzle-orm';

export const vesselItemStandards = mysqlTable(
  'vessel_item_standard',
  {
    id: int('id').primaryKey().autoincrement(),
    vesselId: int('vessel_id').notNull(),
    itemId: int('item_id').notNull(),
    periode: mysqlEnum('periode', periodEnum).notNull(),
    minStock: int('min_stock').notNull(),
    maxStock: int('max_stock').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', fsp: 0 })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    vesselIdx: index('idx_vessel_id').on(table.vesselId),
    itemIdx: index('idx_item_id').on(table.itemId),
  })
);

export const vesselItemStandardsRelations = relations(vesselItemStandards, ({ one }) => ({
  vessel: one(mstVessels, {
    fields: [vesselItemStandards.vesselId],
    references: [mstVessels.id],
  }),
  item: one(mstItems, {
    fields: [vesselItemStandards.itemId],
    references: [mstItems.id],
  }),
}));
