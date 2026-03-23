import prisma from '#config/prisma.ts';

class VesselStockRepository {
	async getVesselStocks(page: number = 1, limit: number = 10, search: string = '') {
		const where = search
			? {
					OR: [
						{
							vessel: {
								name: {
									contains: search,
								},
							},
						},
						{
							item: {
								name: {
									contains: search,
								},
							},
						},
					],
				}
			: {};

		const [items, total] = await Promise.all([
			prisma.vesselStock.findMany({
				select: {
					id: true,
					stockOnHand: true,
					stockMinimal: true,
					lastUpdate: true,
					vessel: {
						select: {
							id: true,
							name: true,
						},
					},
					item: {
						select: {
							id: true,
							itemCode: true,
							name: true,
							unit: true,
						},
					},
				},
				skip: (page - 1) * limit,
				take: limit,
				where,
				orderBy: {
					lastUpdate: 'desc',
				},
			}),
			prisma.vesselStock.count({ where }),
		]);

		return { items, total };
	}

	async findById(id: number) {
		return await prisma.vesselStock.findUnique({
			where: { id },
			include: {
				vessel: true,
				item: true,
			},
		});
	}

	async create(data: {
		vesselId: number;
		itemId: number;
		stockOnHand: number;
		stockMinimal: number;
		lastUpdate: Date;
	}) {
		return await prisma.vesselStock.create({
			data,
			include: {
				vessel: true,
				item: true,
			},
		});
	}

	async update(
		id: number,
		data: {
			vesselId?: number;
			itemId?: number;
			stockOnHand?: number;
			stockMinimal?: number;
			lastUpdate?: Date;
		}
	) {
		return await prisma.vesselStock.update({
			where: { id },
			data,
			include: {
				vessel: true,
				item: true,
			},
		});
	}

	async delete(id: number) {
		return await prisma.vesselStock.delete({
			where: { id },
		});
	}
}

export default VesselStockRepository;
