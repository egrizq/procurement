import db from "../../../config/drizzle";
import { mstVendors, categoryVendorEnum } from "../../../db/schema/index.ts";
import { like, desc, sql, eq } from "drizzle-orm";

class MstVendorRepository {
	async getMasterVendors(
		page: number = 1,
		limit: number = 10,
		search: string = "",
	) {
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

	async addMstVendor({
		name,
		category,
		address,
		phone,
		email,
		city,
	}: {
		name: string;
		category: (typeof categoryVendorEnum)[number];
		address: string;
		phone: string;
		email: string;
		city: string;
	}) {
		const inserted = await db
			.insert(mstVendors)
			.values({ name, category, address, phone, email, city });

		const [vendor] = await db
			.select()
			.from(mstVendors)
			.where(eq(mstVendors.id, inserted[0].insertId))
			.limit(1);
		return vendor;
	}

	async updateMstVendor(
		id: number,
		{
			name,
			category,
			address,
			phone,
			email,
			city,
		}: {
			name: string;
			category: (typeof categoryVendorEnum)[number];
			address: string;
			phone: string;
			email: string;
			city: string;
		},
	) {
		await db
			.update(mstVendors)
			.set({ name, category, address, phone, email, city })
			.where(eq(mstVendors.id, id));

		let [vendor] = await db
			.select()
			.from(mstVendors)
			.where(eq(mstVendors.id, id))
			.limit(1);
		return vendor;
	}

	async deleteMstVendor(id: number) {
		await db.delete(mstVendors).where(eq(mstVendors.id, id));
	}
}

export default MstVendorRepository;
