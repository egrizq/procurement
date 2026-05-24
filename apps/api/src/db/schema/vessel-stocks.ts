import { int, mysqlTable, timestamp, date, index } from 'drizzle-orm/mysql-core';
import { mstItems } from './items';
import { mstVessels } from './vessels';
import { relations } from 'drizzle-orm';

export const vesselStocks = mysqlTable(
  'vessel_stocks',
  {
    id: int('id').primaryKey().autoincrement(),
    vesselId: int('vessel_id').notNull().references(() => mstVessels.id),
    itemId: int('item_id').notNull().references(() => mstItems.id),
    stockOnHand: int('stock_on_hand').notNull(),
    lastUpdate: date('last_update', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    vesselIdIdx: index('idx_vessel_id').on(table.vesselId),
    itemIdIdx: index('idx_item_id').on(table.itemId),
  })
);

export const vesselStocksRelations = relations(vesselStocks, ({ one }) => ({
  item: one(mstItems, {
    fields: [vesselStocks.itemId],
    references: [mstItems.id],
  }),
  vessel: one(mstVessels, {
    fields: [vesselStocks.vesselId],
    references: [mstVessels.id],
  }),
}));
