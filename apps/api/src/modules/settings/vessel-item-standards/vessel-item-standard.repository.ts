import db from '../../../config/drizzle';
import { vesselItemStandards, mstVessels, mstItems } from '../../../db/schema/index.ts';
import { like, desc, eq, and, sql, or, inArray } from 'drizzle-orm';

class VesselItemStandardRepository {
        async getStandards(page: number = 1, limit: number = 10, search: string = '') {
                const searchPattern = `%${search}%`;

                let matchingIds: number[] | null = null;
                if (search) {
                     const results = await db.select({ id: vesselItemStandards.id })
                          .from(vesselItemStandards)
                          .leftJoin(mstVessels, eq(vesselItemStandards.vesselId, mstVessels.id))
                          .leftJoin(mstItems, eq(vesselItemStandards.itemId, mstItems.id))
                          .where(
                               or(like(mstVessels.name, searchPattern), like(mstItems.name, searchPattern))
                          );
                     matchingIds = results.map(r => r.id);
                }

                if (matchingIds !== null && matchingIds.length === 0) {
                     return { items: [], total: 0 };
                }

                const condition = matchingIds ? inArray(vesselItemStandards.id, matchingIds) : undefined;

                const itemsQuery = db.query.vesselItemStandards.findMany({
                        where: condition,
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
                        orderBy: [desc(vesselItemStandards.createdAt)],
                });

                const countQuery = db
                        .select({ count: sql<number>`count(*)` })
                        .from(vesselItemStandards)
                        .where(condition)
                        .then((res) => Number(res[0]?.count || 0));

                const [items, total] = await Promise.all([itemsQuery, countQuery]);
                return { items, total };
        }

        async findById(id: number) {
                const result = await db.query.vesselItemStandards.findFirst({
                        where: eq(vesselItemStandards.id, id),
                        with: { vessel: true, item: true }
                });
                return result || null;
        }

        async findByVesselAndItem(vesselId: number, itemId: number) {
                const result = await db.query.vesselItemStandards.findFirst({
                        where: and(
                             eq(vesselItemStandards.vesselId, vesselId),
                             eq(vesselItemStandards.itemId, itemId)
                        ),
                });
                return result || null;
        }

        async create(data: { vesselId: number; itemId: number; periode: any; minStock: number; maxStock: number; poThreshold?: number | null; }) {
                const inserted = await db.insert(vesselItemStandards).values(data);
                return this.findById(inserted[0].insertId);
        }

        async update(id: number, data: Partial<typeof vesselItemStandards.$inferInsert>) {
                await db.update(vesselItemStandards).set(data).where(eq(vesselItemStandards.id, id));
                return this.findById(id);
        }

        async delete(id: number) {
                const deleted = await this.findById(id);
                if (deleted) {
                    await db.delete(vesselItemStandards).where(eq(vesselItemStandards.id, id));
                }
                return deleted;
        }
}

export default VesselItemStandardRepository;