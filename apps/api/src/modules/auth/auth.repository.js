import prisma from '#config/prisma.ts';

class AuthRepository {
	async createUser(data) {
		return await prisma.user.create({
			data,
		});
	}

	async findUser(data) {
		return await prisma.user.findUnique({
			where: data,
		});
	}
}

export default AuthRepository;
