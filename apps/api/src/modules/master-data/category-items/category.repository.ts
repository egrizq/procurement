import db from "../../../config/drizzle.ts";
import { mstItemCategories } from "../../../db/schema/index.ts";
import { like, desc, sql, eq } from "drizzle-orm";

class CategoryRepository {
	async getCategories(
		page: number = 1,
		limit: number = 10,
		search: string = "",
	) {
		const condition = search
			? like(mstItemCategories.name, `%${search}%`)
			: undefined;

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

		const [categories, total] = await Promise.all([
			categoriesQuery,
			countQuery,
		]);

		return {
			categories,
			total,
		};
	}

	async addCategory(data: any) {
		const [result] = await db.insert(mstItemCategories).values(data);
		const newCategory = await db.query.mstItemCategories.findFirst({
			where: eq(mstItemCategories.id, result.insertId),
		});
		return newCategory;
	}

	async updateCategory(id: number, data: any) {
		await db
			.update(mstItemCategories)
			.set(data)
			.where(eq(mstItemCategories.id, id));
		const updatedCategory = await db.query.mstItemCategories.findFirst({
			where: eq(mstItemCategories.id, id),
		});
		return updatedCategory;
	}

	async deleteCategory(id: number) {
		const result = await db
			.delete(mstItemCategories)
			.where(eq(mstItemCategories.id, id));
		return result[0].affectedRows > 0;
	}
}

export default CategoryRepository;
