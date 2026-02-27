import prisma from '#config/prisma.ts';

class MstItemRepository {
	async getMasterItems(page = 1, limit = 10, search = "") {
		const where = {
			name: {
				contains: search,
			},
		};

		const [items, total] = await Promise.all([
			prisma.mstItem.findMany({
				select: {
					id: true,
					itemCode: true,
					name: true,
					unit: true,
					status: true,
					description: true,
					category: {
						select: {
							id: true,
							name: true,
							status: true,
						},
					},
				},
				skip: (page - 1) * limit,
				take: limit,
				where,
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.mstItem.count({ where }),
		]);

		return { items, total };
	}

	async findItemByIds(ids) {
		return await prisma.mstItem.findMany({
			where: {
				id: {
					in: ids,
				},
			},
		});
	}
}

export default MstItemRepository;
