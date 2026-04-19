import db from '../../../config/drizzle';
import { mstVessels } from '../../../db/schema/index.ts';
import { like, desc, eq, sql } from 'drizzle-orm';

class MstVesselRepository {
        async getMasterVessels(page: number = 1, limit: number = 10, search: string = '') {
                const condition = search ? like(mstVessels.name, `%${search}%`) : undefined;

                const vesselsQuery = db.query.mstVessels.findMany({
                        where: condition,
                        columns: {
                                updatedAt: false,
                        },
                        offset: (page - 1) * limit,
                        limit: limit,
                        orderBy: [desc(mstVessels.createdAt)],
                });

                const countQuery = db
                        .select({ count: sql<number>`count(*)` })
                        .from(mstVessels)
                        .where(condition)
                        .then((res) => Number(res[0]?.count || 0));

                const [vessels, total] = await Promise.all([vesselsQuery, countQuery]);

                return { vessels, total };
        }

        async findVessel(data: { id: number }) {
                const result = await db.query.mstVessels.findFirst({
                        where: eq(mstVessels.id, data.id),
                });
                return result || null;
        }
}

export default MstVesselRepository;
