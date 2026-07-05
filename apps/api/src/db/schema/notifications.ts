import {
	int,
	mysqlTable,
	varchar,
	text,
	boolean,
	timestamp,
	index,
} from "drizzle-orm/mysql-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const notifications = mysqlTable(
	"notifications",
	{
		id: int("id").primaryKey().autoincrement(),
		userId: int("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: varchar("type", { length: 100 }).notNull(),
		title: varchar("title", { length: 255 }).notNull(),
		message: text("message").notNull(),
		entityType: varchar("entity_type", { length: 50 }),
		entityId: int("entity_id"),
		isRead: boolean("is_read").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("idx_notifications_user_id").on(table.userId),
		isReadIdx: index("idx_notifications_is_read").on(table.isRead),
	}),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
}));
