import prisma from '#config/prisma.ts';
import type { Prisma } from '@prisma/client';

class VesselRequestRepository {
	async createVesselRequest(data: Prisma.VesselRequestCreateInput) {
		return await prisma.vesselRequest.create({
			data,
		});
	}

	async createVesselRequestItems(data: Prisma.VesselRequestItemCreateManyInput[]) {
		return await prisma.vesselRequestItem.createMany({
			data,
		});
	}

	async getVesselRequests(page: number = 1, limit: number = 10, search: string = '') {
		const where = {
			user: {
				fullName: {
					contains: search,
				},
			},
		};

		const [items, total] = await Promise.all([
			prisma.vesselRequest.findMany({
				select: {
					id: true,
					requestCode: true,
					status: true,
					priority: true,
					justification: true,
					requestDate: true,
					_count: {
						select: {
							vesselRequestItems: true,
						},
					},
					user: {
						select: {
							id: true,
							fullName: true,
						},
					},
					vessel: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				skip: (page - 1) * limit,
				take: limit,
				where,
				orderBy: {
					requestDate: 'desc',
				},
			}),
			prisma.vesselRequest.count({ where }),
		]);

		return { items, total };
	}

	async countVesselRequests(filter: Prisma.VesselRequestWhereInput) {
		return await prisma.vesselRequest.count({
			where: filter,
		});
	}

	async getVesselRequestById(id: number) {
		return await prisma.vesselRequest.findUnique({
			where: { id },
			select: {
				id: true,
				requestCode: true,
				status: true,
				priority: true,
				justification: true,
				requestDate: true,
				vesselRequestItems: {
					select: {
						id: true,
						item: {
							select: {
								id: true,
								name: true,
							},
						},
						qtyRequested: true,
						qtyApproved: true,
						unit: true,
						status: true,
						priority: true,
						justification: true,
					},
				},
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
				vessel: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}
}

export default VesselRequestRepository;
