import { int, mysqlTable, timestamp, varchar, index, uniqueIndex } from 'drizzle-orm/mysql-core';
import { users } from './users';

export const apiTokens = mysqlTable(
  'api_tokens',
  {
    id: int('id').primaryKey().autoincrement(),
    deviceId: varchar('device_id', { length: 255 }).notNull(),
    deviceName: varchar('device_name', { length: 255 }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    userId: int('user_id').references(() => users.id),
    expiredAt: timestamp('expired_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({ idxDeviceUser:
      index('idx_device_user').on(table.deviceId, table.userId)
  })
);
