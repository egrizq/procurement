import { int, mysqlTable, timestamp, varchar, text, uniqueIndex } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const poSettings = mysqlTable(
  'po_settings',
  {
    id: int('id').primaryKey().autoincrement(),
    key: varchar('key', { length: 100 }).notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    description: text('description'),
    updatedBy: int('updated_by').references(() => users.id),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    keyUnique: uniqueIndex('idx_po_settings_key').on(table.key),
  })
);

export const poSettingsRelations = relations(poSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [poSettings.updatedBy],
    references: [users.id],
  }),
}));
