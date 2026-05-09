import db from "../../../config/drizzle.ts";
import { mstItemCategories } from "../../../db/schema/index.ts";
import { like, desc, sql } from "drizzle-orm";

class CategoryRepository {
    async getCategories(page: number = 1, limit: number = 10, search: string = "") {
        const condition = search ? like(mstItemCategories.name, `%${search}%`) : undefined;

        const categoriesQuery = db.query.mstItemCategories.findMany({
            where: condition,
            offset: (page - 1) * limit,
            limit: limit,
            orderBy: [desc(mstItemCategories.createdAt)],
        });

        const countQuery = db
            .select({ count: sql<number>`count(*)` })
            .from(mstItemCategories)
            .where(condition)
            .then((res) => Number(res[0]?.count || 0));

        const [categories, total] = await Promise.all([categoriesQuery, countQuery]);

        return { categories, total };
    }
}

export default CategoryRepository;