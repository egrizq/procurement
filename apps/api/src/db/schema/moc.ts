import { int, mysqlTable, mysqlEnum, timestamp, varchar, text, boolean } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { vesselRequests, vesselRequestItems } from './vessel-requests';
import { mstVendors } from './vendors';
import { users } from './users';

export const mocStatusEnum = ['Draft', 'Completed'] as const;

export const mocs = mysqlTable(
  'mocs',
  {
    id: int('id').primaryKey().autoincrement(),
    vesselRequestId: int('vessel_request_id').notNull().references(() => vesselRequests.id),
    vesselRequestItemId: int('vessel_request_item_id').notNull().references(() => vesselRequestItems.id),
    status: mysqlEnum('status', mocStatusEnum).default('Draft').notNull(),
    createdBy: int('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', fsp: 0 })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  }
);

export const mocVendors = mysqlTable(
  'moc_vendors',
  {
    id: int('id').primaryKey().autoincrement(),
    mocId: int('moc_id').notNull().references(() => mocs.id, { onDelete: 'cascade' }),
    vendorId: int('vendor_id').notNull().references(() => mstVendors.id),
    unitPrice: int('unit_price').notNull(),
    leadTime: varchar('lead_time', { length: 100 }).notNull(),
    remarks: text('remarks'),
    isSelected: boolean('is_selected').default(false).notNull(),
  }
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
  mocVendors: many(mocVendors),
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
