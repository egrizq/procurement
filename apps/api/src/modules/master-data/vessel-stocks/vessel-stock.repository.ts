import db from '../../../config/drizzle';
import { vesselStocks, mstVessels, mstItems } from '../../../db/schema/index.ts';
import { like, desc, eq, sql, or, inArray } from 'drizzle-orm';

class VesselStockRepository {
        async getVesselStocks(page: number = 1, limit: number = 10, search: string = '') {
                const searchPattern = `%${search}%`;

                let matchingIds: number[] | null = null;
                if (search) {
                     const results = await db.select({ id: vesselStocks.id })
                          .from(vesselStocks)
                          .leftJoin(mstVessels, eq(vesselStocks.vesselId, mstVessels.id))
                          .leftJoin(mstItems, eq(vesselStocks.itemId, mstItems.id))
                          .where(
                               or(like(mstVessels.name, searchPattern), like(mstItems.name, searchPattern))
                          );
                     matchingIds = results.map(r => r.id);
                }

                if (matchingIds !== null && matchingIds.length === 0) {
                     return { items: [], total: 0 };
                }

                const condition = matchingIds ? inArray(vesselStocks.id, matchingIds) : undefined;

                const itemsQuery = db.query.vesselStocks.findMany({
                        where: condition,
                        columns: {
                                id: true,
                                stockOnHand: true,
                                stockMinimal: true,
                                lastUpdate: true,
                        },
                        with: {
                                vessel: {
                                        columns: { id: true, name: true }
                                },
                                item: {
                                        columns: { id: true, itemCode: true, name: true, unit: true }
                                }
                        },
                        offset: (page - 1) * limit,
                        limit: limit,
                        orderBy: [desc(vesselStocks.lastUpdate)],
                });

                const countQuery = db
                        .select({ count: sql<number>`count(*)` })
                        .from(vesselStocks)
                        .where(condition)
                        .then((res) => Number(res[0]?.count || 0));

                const [items, total] = await Promise.all([itemsQuery, countQuery]);
                return { items, total };
        }

        async findById(id: number) {
                const result = await db.query.vesselStocks.findFirst({
                        where: eq(vesselStocks.id, id),
                        with: { vessel: true, item: true }
                });
                return result || null;
        }

        async create(data: { vesselId: number; itemId: number; stockOnHand: number; stockMinimal: number; lastUpdate: Date; }) {
                const inserted = await db.insert(vesselStocks).values(data);
                return this.findById(inserted[0].insertId);
        }

        async update(id: number, data: Partial<typeof vesselStocks.$inferInsert>) {
                await db.update(vesselStocks).set(data).where(eq(vesselStocks.id, id));
                return this.findById(id);
        }

        async delete(id: number) {
                const deleted = await this.findById(id);
                if (deleted) {
                    await db.delete(vesselStocks).where(eq(vesselStocks.id, id));
                }
                return deleted;
        }
}

export default VesselStockRepository;
