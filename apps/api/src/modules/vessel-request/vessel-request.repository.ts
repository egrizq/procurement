import db from '../../config/drizzle';
import { vesselRequests, vesselRequestItems, users, vesselStocks, vesselItemStandards } from '../../db/schema/index.ts';
import { desc, eq, like, sql, inArray, and, gte } from 'drizzle-orm';

class VesselRequestRepository {
        async createVesselRequest(data: any) {
                const mappedData = {
                        requestCode: data.requestCode,
                        requestedBy: data.user.connect.id,
                        vesselId: data.vessel.connect.id,
                        status: data.status,
                        priority: data.priority,
                        justification: data.justification,
                        requestDate: new Date(data.requestDate),
                };
                const inserted = await db.insert(vesselRequests).values(mappedData);
                return await this.getVesselRequestById(inserted[0].insertId);
        }

        async createVesselRequestItems(data: any[]) {
                await db.insert(vesselRequestItems).values(data);
                return { count: data.length };
        }

        async getVesselRequests(page: number = 1, limit: number = 10, search: string = '') {
                const searchPattern = `%${search}%`;

                let matchingUserIds: number[] | null = null;
                if (search) {
                     const results = await db.select({ id: vesselRequests.id })
                          .from(vesselRequests)
                          .where(like(vesselRequests.requestCode, searchPattern));
                     matchingUserIds = results.map(r => r.id);
                }

                if (matchingUserIds !== null && matchingUserIds.length === 0) {
                     return { items: [], total: 0 };
                }

                const condition = matchingUserIds ? inArray(vesselRequests.id, matchingUserIds) : undefined;

                const itemsQuery = db.query.vesselRequests.findMany({
                        where: condition,
                        columns: {
                                id: true,
                                requestCode: true,
                                status: true,
                                priority: true,
                                justification: true,
                                requestDate: true,
                        },
                        with: {
                                items: {
                                        columns: { id: true }
                                },
                                user: {
                                        columns: { id: true, fullName: true },
                                },
                                vessel: {
                                        columns: { id: true, name: true },
                                },
                        },
                        offset: (page - 1) * limit,
                        limit: limit,
                        orderBy: [desc(vesselRequests.requestDate)],
                });

                const countQuery = db
                        .select({ count: sql<number>`count(*)` })
                        .from(vesselRequests)
                        .where(condition)
                        .then((res) => Number(res[0]?.count || 0));

                let [itemsResult, total] = await Promise.all([itemsQuery, countQuery]);
                
                // Map to simulate prisma _count
                const items = itemsResult.map(item => ({
                        ...item,
                        _count: {
                                vesselRequestItems: item.items.length
                        },
                        items: undefined
                }));

                return { items, total };
        }

        async countVesselRequests(filter: any) {
                // To maintain backward compatibility if used later. 
                // Assumes filter is empty or simple object match natively.
                const countResult = await db.select({ count: sql<number>`count(*)` }).from(vesselRequests);
                return Number(countResult[0]?.count || 0);
        }

        async getVesselRequestById(id: number) {
                const result = await db.query.vesselRequests.findFirst({
                        where: eq(vesselRequests.id, id),
                        columns: {
                                id: true,
                                requestCode: true,
                                status: true,
                                priority: true,
                                justification: true,
                                requestDate: true,
                        },
                        with: {
                                items: {
                                        columns: {
                                                id: true,
                                                qtyRequested: true,
                                                qtyApproved: true,
                                                unit: true,
                                                status: true,
                                                priority: true,
                                                justification: true,
                                        },
                                        with: {
                                                item: {
                                                        columns: { id: true, name: true },
                                                },
                                        }
                                },
                                user: {
                                        columns: { id: true, fullName: true },
                                },
                                vessel: {
                                        columns: { id: true, name: true },
                                },
                        },
                });
                
                if (!result) return null;
                
                return {
                     ...result,
                     vesselRequestItems: result.items,
                     items: undefined
                };
        }

        async findRecentRequestedItems(vesselId: number, itemIds: number[], days = 30) {
                if (!itemIds || itemIds.length === 0) return [];
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - days);

                const results = await db
                        .select({
                                itemId: vesselRequestItems.itemId,
                                requestDate: vesselRequests.requestDate,
                                requestCode: vesselRequests.requestCode,
                        })
                        .from(vesselRequestItems)
                        .innerJoin(vesselRequests, eq(vesselRequestItems.vesselRequestId, vesselRequests.id))
                        .where(
                                and(
                                        eq(vesselRequests.vesselId, vesselId),
                                        inArray(vesselRequestItems.itemId, itemIds),
                                        gte(vesselRequests.requestDate, dateLimit)
                                )
                        )
                        .orderBy(desc(vesselRequests.requestDate));

                return results;
        }

        async getVesselItemStandards(vesselId: number, itemIds: number[]) {
                if (!itemIds || itemIds.length === 0) return [];
                const results = await db
                        .select()
                        .from(vesselItemStandards)
                        .where(
                                and(
                                        eq(vesselItemStandards.vesselId, vesselId),
                                        inArray(vesselItemStandards.itemId, itemIds)
                                )
                        );
                return results;
        }

        async getVesselStocks(vesselId: number, itemIds: number[]) {
                if (!itemIds || itemIds.length === 0) return [];
                const results = await db
                        .select()
                        .from(vesselStocks)
                        .where(
                                and(
                                        eq(vesselStocks.vesselId, vesselId),
                                        inArray(vesselStocks.itemId, itemIds)
                                )
                        );
                return results;
        }
}

export default VesselRequestRepository;
