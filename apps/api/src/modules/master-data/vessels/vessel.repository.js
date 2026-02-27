import prisma from '#config/prisma.ts';

class MstVesselRepository {
	async getMasterVessels(page = 1, limit = 10, search = "") {
		const where = {
			name: {
				contains: search,
			},
		};

		const [vessels, total] = await Promise.all([
			prisma.mstVessel.findMany({
				select: {
					id: true,
					imoNumber: true,
					name: true,
					flag: true,
					type: true,
					status: true,
					imgUrl: true,
					createdAt: true,
				},
				skip: (page - 1) * limit,
				take: limit,
				where,
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.mstVessel.count({ where }),
		]);

		return { vessels, total };
	}

	async findVessel(data) {
		return await prisma.mstVessel.findUnique({
			where: data,
		});
	}
}

export default MstVesselRepository;
