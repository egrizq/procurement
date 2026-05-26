import db from "../../config/drizzle";
import {
	mstItems,
	mstVendors,
	mstVessels,
	vesselRequests,
	users,
} from "../../db/schema/index.ts";
import { sql, eq, desc } from "drizzle-orm";

class DashboardRepository {
	async getStats() {
		// Get total items
		const totalItemsQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(mstItems)
			.then((res) => Number(res[0]?.count || 0));

		// Get active vendors
		const activeVendorsQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(mstVendors)
			.then((res) => Number(res[0]?.count || 0));

		// Get active vessels (status = 'Publish')
		const activeVesselsQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(mstVessels)
			.where(eq(mstVessels.status, "Publish"))
			.then((res) => Number(res[0]?.count || 0));

		// Get pending requests (status = 'Waiting')
		const pendingRequestsQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(vesselRequests)
			.where(eq(vesselRequests.status, "Waiting"))
			.then((res) => Number(res[0]?.count || 0));

		const [totalItems, activeVendors, activeVessels, pendingRequests] =
			await Promise.all([
				totalItemsQuery,
				activeVendorsQuery,
				activeVesselsQuery,
				pendingRequestsQuery,
			]);

		return {
			totalItems,
			activeVendors,
			activeVessels,
			pendingRequests,
		};
	}

	async getRecentActivity() {
		// Get 5 most recent vessel requests for activity
		const recentRequests = await db
			.select({
				id: vesselRequests.id,
				requestCode: vesselRequests.requestCode,
				status: vesselRequests.status,
				createdAt: vesselRequests.createdAt,
				vesselName: mstVessels.name,
				requestedBy: users.username,
			})
			.from(vesselRequests)
			.leftJoin(mstVessels, eq(vesselRequests.vesselId, mstVessels.id))
			.leftJoin(users, eq(vesselRequests.requestedBy, users.id))
			.orderBy(desc(vesselRequests.createdAt))
			.limit(5);

		return recentRequests;
	}
}

export default DashboardRepository;
