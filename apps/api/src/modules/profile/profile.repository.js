import prisma from '#config/prisma.ts';

class ProfileRepository {
	async getUserById(userId) {
		return await prisma.user.findFirst({
			where: { id: userId },
			select: {
				id: true,
				username: true,
				email: true,
				fullName: true,
				type: true,
				department: true,
				vessel: {
					select: {
						id: true,
						name: true,
					},
				},
				position: true,
				status: true,
				leaveDate: true,
				imgUrl: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}
}

export default ProfileRepository;
