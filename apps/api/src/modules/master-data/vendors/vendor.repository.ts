import db from '../../../config/drizzle';
import { mstVendors } from '../../../db/schema/index.ts';
import { like, desc, sql } from 'drizzle-orm';

class MstVendorRepository {
        async getMasterVendors(page: number = 1, limit: number = 10, search: string = '') {
                const condition = search ? like(mstVendors.name, `%${search}%`) : undefined;

                const vendorsQuery = db.query.mstVendors.findMany({
                        where: condition,
                        columns: {
                                updatedAt: false,
                        },
                        offset: (page - 1) * limit,
                        limit: limit,
                        orderBy: [desc(mstVendors.createdAt)],
                });

                const countQuery = db
                        .select({ count: sql<number>`count(*)` })
                        .from(mstVendors)
                        .where(condition)
                        .then((res) => Number(res[0]?.count || 0));

                const [vendors, total] = await Promise.all([vendorsQuery, countQuery]);

                return { vendors, total };
        }
}

export default MstVendorRepository;
