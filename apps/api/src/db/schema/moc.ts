import { int, mysqlTable, mysqlEnum, timestamp, text, boolean, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { vesselRequests, vesselRequestItems } from './vessel-requests';
import { mstVendors } from './vendors';
import { users } from './users';
import { purchaseOrders } from './purchase-orders';

export const mocStatusEnum = ['Draft', 'Completed', 'Approved'] as const;

export const mocs = mysqlTable(
  'mocs',
  {
    id: int('id').primaryKey().autoincrement(),
    vesselRequestId: int('vessel_request_id').notNull().references(() => vesselRequests.id),
    vesselRequestItemId: int('vessel_request_item_id').notNull().references(() => vesselRequestItems.id),
    status: mysqlEnum('status', mocStatusEnum).default('Draft').notNull(),
    selectedVendorId: int('selected_vendor_id').references(() => mstVendors.id),
    createdBy: int('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
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
    availableQty: int('available_qty').notNull().default(0),
    warranty: int('warranty').notNull().default(0),
    discount: int('discount').notNull().default(0),
    sawScore: decimal('saw_score', { precision: 10, scale: 4 }),
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
  selectedVendor: one(mstVendors, {
    fields: [mocs.selectedVendorId],
    references: [mstVendors.id],
  }),
  mocVendors: many(mocVendors),
  purchaseOrders: many(purchaseOrders),
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
