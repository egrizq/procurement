import prisma from '#config/prisma.ts';
import type { Prisma } from '@prisma/client';

class ApiTokenRepository {
	static TOKEN_EXP_MS = new Date(Date.now() + 24 * 60 * 60 * 1000);

	async findToken(where: Prisma.ApiTokenFindFirstArgs) {
		const result = await prisma.apiToken.findFirst(where);
		return result;
	}

	async createToken(tokenHash: string, deviceId: string, deviceName: string) {
		const result = await prisma.apiToken.create({
			data: {
				token: tokenHash,
				deviceId: deviceId,
				deviceName: deviceName,
				expiredAt: ApiTokenRepository.TOKEN_EXP_MS,
			},
		});

		return result;
	}

	async updateToken(token: string, data: Prisma.ApiTokenUpdateInput) {
		const result = await prisma.apiToken.update({
			where: {
				token: token,
			},
			data: data,
		});

		return result;
	}
}

export default ApiTokenRepository;
