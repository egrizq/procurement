import { int, mysqlTable, mysqlEnum, timestamp, varchar, date, index, uniqueIndex } from 'drizzle-orm/mysql-core';
import { usersTypeEnum, departmentEnum, userStatusEnum } from './enums';
import { mstVessels } from './vessels';
import { relations } from 'drizzle-orm';
import { vesselRequests } from './vessel-requests';

export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }),
    type: mysqlEnum('type', usersTypeEnum).notNull(),
    department: mysqlEnum('department', departmentEnum).notNull(),
    vesselId: int('vessel_id').notNull().references(() => mstVessels.id),
    position: varchar('position', { length: 100 }),
    status: mysqlEnum('status', userStatusEnum).default('Contract').notNull(),
    leaveDate: date('leave_date', { mode: 'date' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    imgUrl: varchar('img_url', { length: 255 }),
  },
  (table) => ({
    vesselIdIdx: index('users_vessel_id_fkey').on(table.vesselId),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  vessel: one(mstVessels, {
    fields: [users.vesselId],
    references: [mstVessels.id],
  }),
  vesselRequests: many(vesselRequests, { relationName: 'vesselRequests' }),
  vesselRequestsReviewed: many(vesselRequests, { relationName: 'vessel_requests_reviewed_byTousers' }),
}));
