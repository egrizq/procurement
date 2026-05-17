import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const mstCities = mysqlTable(
  'mst_city',
  {
    id: int('id').primaryKey().autoincrement(),
    cityName: varchar('city_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', fsp: 0 }).defaultNow().notNull(),
  },
);
