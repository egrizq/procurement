import db from "#config/drizzle.ts";
import { notifications } from "../../db/schema/index.ts";
import { eq, and, desc, sql } from "drizzle-orm";

class NotificationRepository {
	async getByUserId(
		userId: number,
		page: number = 1,
		limit: number = 20,
	) {
		const offset = (page - 1) * limit;

		const [items, countResult] = await Promise.all([
			db.query.notifications.findMany({
				where: eq(notifications.userId, userId),
				orderBy: [desc(notifications.createdAt)],
				limit,
				offset,
			}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(notifications)
				.where(eq(notifications.userId, userId))
				.then((r) => Number(r[0]?.count || 0)),
		]);

		return { items, total: countResult };
	}

	async getUnreadCount(userId: number) {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(notifications)
			.where(
				and(
					eq(notifications.userId, userId),
					eq(notifications.isRead, false),
				),
			);
		return Number(result[0]?.count || 0);
	}

	async markAsRead(notificationId: number, userId: number) {
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(
				and(
					eq(notifications.id, notificationId),
					eq(notifications.userId, userId),
				),
			);
	}

	async markAllAsRead(userId: number) {
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(
				and(
					eq(notifications.userId, userId),
					eq(notifications.isRead, false),
				),
			);
	}
}

export default NotificationRepository;
