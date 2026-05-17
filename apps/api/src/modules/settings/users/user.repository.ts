import db from '../../../config/drizzle';
import { users } from '../../../db/schema/index.ts';
import { like, desc, eq, sql, or, and } from 'drizzle-orm';

// Columns to select (excludes password)
const userColumns = {
	id: true,
	username: true,
	email: true,
	fullName: true,
	type: true,
	department: true,
	vesselId: true,
	position: true,
	status: true,
	leaveDate: true,
	createdAt: true,
	updatedAt: true,
	imgUrl: true,
} as const;

class UserRepository {
	async getUsers(
		page: number = 1,
		limit: number = 10,
		search: string = '',
		filters: { type?: string; department?: string; status?: string } = {}
	) {
		const conditions = [];

		// Search across username, email, fullName (case-insensitive with LIKE)
		if (search) {
			const searchPattern = `%${search}%`;
			conditions.push(
				or(
					like(users.username, searchPattern),
					like(users.email, searchPattern),
					like(users.fullName, searchPattern)
				)
			);
		}

		// Apply filters with AND logic
		if (filters.type) {
			conditions.push(eq(users.type, filters.type as any));
		}
		if (filters.department) {
			conditions.push(eq(users.department, filters.department as any));
		}
		if (filters.status) {
			conditions.push(eq(users.status, filters.status as any));
		}

		const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

		const itemsQuery = db.query.users.findMany({
			where: whereCondition,
			columns: userColumns,
			offset: (page - 1) * limit,
			limit: limit,
			orderBy: [desc(users.createdAt)],
		});

		const countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(users)
			.where(whereCondition)
			.then((res) => Number(res[0]?.count || 0));

		const [items, total] = await Promise.all([itemsQuery, countQuery]);
		return { items, total };
	}

	async findById(id: number) {
		const result = await db.query.users.findFirst({
			where: eq(users.id, id),
			columns: userColumns,
			with: {
				vessel: {
					columns: { id: true, name: true },
				},
			},
		});
		return result || null;
	}

	async findByUsername(username: string) {
		const result = await db.query.users.findFirst({
			where: eq(users.username, username),
			columns: userColumns,
		});
		return result || null;
	}

	async findByEmail(email: string) {
		const result = await db.query.users.findFirst({
			where: eq(users.email, email),
			columns: userColumns,
		});
		return result || null;
	}

	async create(data: {
		username: string;
		email: string;
		password: string;
		fullName?: string;
		type: string;
		department: string;
		vesselId: number;
		position?: string;
		status?: string;
		imgUrl?: string;
	}) {
		const inserted = await db.insert(users).values(data as any);
		return this.findById(inserted[0].insertId);
	}

	async update(id: number, data: Partial<typeof users.$inferInsert>) {
		await db.update(users).set(data).where(eq(users.id, id));
		return this.findById(id);
	}

	async softDelete(id: number) {
		await db
			.update(users)
			.set({
				status: 'Leave',
				leaveDate: new Date(),
			})
			.where(eq(users.id, id));
		return this.findById(id);
	}
}

export default UserRepository;
