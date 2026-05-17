import { int, mysqlTable, mysqlEnum, varchar, uniqueIndex } from 'drizzle-orm/mysql-core';
import { usersTypeEnum } from './enums';

export const roleModules = mysqlTable(
  'role_modules',
  {
    id: int('id').primaryKey().autoincrement(),
    userType: mysqlEnum('user_type', usersTypeEnum).notNull(),
    moduleSlug: varchar('module_slug', { length: 100 }).notNull(),
  },
  (table) => ({
    uniqueTypeModule: uniqueIndex('role_modules_type_slug_unique').on(table.userType, table.moduleSlug),
  })
);
