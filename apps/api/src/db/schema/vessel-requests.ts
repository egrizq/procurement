import { int, mysqlTable, mysqlEnum, timestamp, varchar, date, text, index } from 'drizzle-orm/mysql-core';
import { requestStatusEnum, priorityEnum, unitEnum } from './enums';
import { mstItems } from './items';
import { mstVessels } from './vessels';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const vesselRequests = mysqlTable(
  'vessel_requests',
  {
    id: int('id').primaryKey().autoincrement(),
    requestCode: varchar('request_code', { length: 100 }).notNull(),
    requestedBy: int('requested_by').notNull(),
    vesselId: int('vessel_id').notNull(),
    status: mysqlEnum('status', requestStatusEnum).default('Waiting').notNull(),
    priority: mysqlEnum('priority', priorityEnum).default('Medium').notNull(),
    justification: text('justification'),
    requestDate: date('request_date', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', fsp: 0 })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    reviewedAt: timestamp('reviewed_at', { mode: 'date', fsp: 0 }),
    reviewedBy: int('reviewed_by'),
  },
  (table) => ({
    vesselIdIdx: index('idx_vessel_id').on(table.vesselId),
    statusIdx: index('idx_status').on(table.status),
    requestedByIdx: index('vessel_requests_requested_by_fkey').on(table.requestedBy),
    reviewedByIdx: index('vessel_requests_reviewed_by_fkey').on(table.reviewedBy),
  })
);

export const vesselRequestItems = mysqlTable(
  'vessel_request_items',
  {
    id: int('id').primaryKey().autoincrement(),
    vesselRequestId: int('vessel_request_id').notNull(),
    itemId: int('item_id').notNull(),
    qtyRequested: int('qty_requested').notNull(),
    qtyApproved: int('qty_approved'),
    unit: mysqlEnum('unit', unitEnum).notNull(),
    status: mysqlEnum('status', requestStatusEnum).default('Waiting').notNull(),
    priority: mysqlEnum('priority', priorityEnum).default('Medium').notNull(),
    justification: text('justification'),
    createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', fsp: 0 })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    staffJustification: text('staff_justification'),
  },
  (table) => ({
    vesselRequestIdIdx: index('idx_vessel_request_id').on(table.vesselRequestId),
    itemIdIdx: index('idx_item_id').on(table.itemId),
  })
);

export const vesselRequestsRelations = relations(vesselRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [vesselRequests.requestedBy],
    references: [users.id],
    relationName: 'vesselRequests',
  }),
  reviewer: one(users, {
    fields: [vesselRequests.reviewedBy],
    references: [users.id],
    relationName: 'vessel_requests_reviewed_byTousers',
  }),
  vessel: one(mstVessels, {
    fields: [vesselRequests.vesselId],
    references: [mstVessels.id],
  }),
  items: many(vesselRequestItems),
}));

export const vesselRequestItemsRelations = relations(vesselRequestItems, ({ one }) => ({
  vesselRequest: one(vesselRequests, {
    fields: [vesselRequestItems.vesselRequestId],
    references: [vesselRequests.id],
  }),
  item: one(mstItems, {
    fields: [vesselRequestItems.itemId],
    references: [mstItems.id],
  }),
}));
