import { int, mysqlTable, mysqlEnum, timestamp, varchar, text, index } from 'drizzle-orm/mysql-core';
import { unitEnum, statusEnum } from './enums';
import { relations } from 'drizzle-orm';

export const mstItemCategories = mysqlTable('mst_item_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  status: mysqlEnum('status', statusEnum).default('Publish').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 0 })
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});

export const mstItems = mysqlTable(
  'mst_items',
  {
    id: int('id').primaryKey().autoincrement(),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    unit: mysqlEnum('unit', unitEnum).notNull(),
    categoryId: int('category_id').notNull().references(() => mstItemCategories.id),
    status: mysqlEnum('status', statusEnum).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', fsp: 0 })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index('idx_item_code').on(table.itemCode),
    index('idx_category_id').on(table.categoryId),
    index('idx_status').on(table.status),
  ]
);

export const mstItemRelations = relations(mstItems, ({ one }) => ({
  category: one(mstItemCategories, {
    fields: [mstItems.categoryId],
    references: [mstItemCategories.id],
  }),
}));

export const mstItemCategoryRelations = relations(mstItemCategories, ({ many }) => ({
  items: many(mstItems),
}));
