import prisma from '#config/prisma.ts';
import type { Prisma } from '@prisma/client';

class AuthRepository {
	async createUser(data: Prisma.UserCreateInput) {
		return await prisma.user.create({
			data,
		});
	}

	async findUser(data: Prisma.UserWhereUniqueInput) {
		return await prisma.user.findUnique({
			where: data,
		});
	}
}

export default AuthRepository;
