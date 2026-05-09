import db from "../../../config/drizzle";
import { mstItems } from "../../../db/schema/index.ts";
import { like, inArray, desc, sql } from "drizzle-orm";

class MstItemRepository {
	async getMasterItems(
		page: number = 1,
		limit: number = 10,
		search: string = "",
	) {
		const condition = search ? like(mstItems.name, `%${search}%`) : undefined;

		const itemsQuery = db.query.mstItems.findMany({
			where: condition,
			columns: {
				categoryId: false,
				createdAt: false,
				updatedAt: false,
			},
			with: {
				category: {
					columns: {
						id: true,
						name: true,
						status: true,
					},
				},
			},
			offset: (page - 1) * limit,
			limit: limit,
			orderBy: [desc(mstItems.createdAt)],
		});

		const countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(mstItems)
			.where(condition)
			.then((res) => Number(res[0]?.count || 0));

		const [items, total] = await Promise.all([itemsQuery, countQuery]);

		return { items, total };
	}

	async findItemByIds(ids: number[]) {
		if (!ids || ids.length === 0) return [];
		return await db.query.mstItems.findMany({
			where: inArray(mstItems.id, ids),
		});
	}

	async addMasterItem(data: any) {
		const [lastItem] = await db
			.select({ itemCode: mstItems.itemCode })
			.from(mstItems)
			.orderBy(desc(mstItems.id))
			.limit(1);

		let newCode = "ITM-0001";
		if (lastItem && lastItem.itemCode && lastItem.itemCode.startsWith("ITM-")) {
			const lastNumber = parseInt(lastItem.itemCode.split("-")[1]!, 10);
			if (!isNaN(lastNumber)) {
				newCode = `ITM-${String(lastNumber + 1).padStart(4, "0")}`;
			}
		}
		data.itemCode = newCode;

		const [result] = await db.insert(mstItems).values(data);
		return { id: result.insertId, ...data };
	}

	async updateMasterItem(id: number, data: any) {
		const [updatedItem] = await db
			.update(mstItems)
			.set(data)
			.where(sql`${mstItems.id} = ${id}`);
		return updatedItem;
	}

	async deleteMasterItem(id: number) {
		const result = await db
			.delete(mstItems)
			.where(sql`${mstItems.id} = ${id}`);
		return result.length > 0;
	}
}

export default MstItemRepository;
