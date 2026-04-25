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
    expiredAt: timestamp('expired_at', { mode: 'date', fsp: 0 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', fsp: 0 })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({ idxDeviceUser:
      index('idx_device_user').on(table.deviceId, table.userId)
  })
);
