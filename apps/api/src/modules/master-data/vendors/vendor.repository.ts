import prisma from '#config/prisma.ts';

class MstVendorRepository {
	async getMasterVendors(page: number = 1, limit: number = 10, search: string = '') {
		const where = {
			name: {
				contains: search,
			},
		};

		const [vendors, total] = await Promise.all([
			prisma.mstVendor.findMany({
				select: {
					id: true,
					name: true,
					category: true,
					address: true,
					phone: true,
					email: true,
					city: true,
					createdAt: true,
				},
				skip: (page - 1) * limit,
				take: limit,
				where,
				orderBy: {
					createdAt: 'desc',
				},
			}),
			prisma.mstVendor.count({ where }),
		]);

		return { vendors, total };
	}
}

export default MstVendorRepository;
