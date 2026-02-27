import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import { generateToken, hashToken } from './token.utils.ts';
import ApiTokenRepository from './token.repository.ts';
import AppError from '#shared/utils/error.ts';

const apiTokenRepo = new ApiTokenRepository();

const createApiToken = asyncHandler(async (req: Request, res: Response) => {
	const { device_name, device_id } = req.body;

	if (!device_name || !device_id) {
		throw new AppError('Device name and device ID are required', 400);
	}

	const rawToken = generateToken();
	const hashedToken = hashToken(rawToken);

	const findToken = await apiTokenRepo.findToken({
		where: { deviceId: device_id },
	});
	if (findToken) {
		const data = {
			token: hashedToken,
			expiredAt: ApiTokenRepository.TOKEN_EXP_MS,
		};

		const response = await apiTokenRepo.updateToken(findToken.token, data);
		if (!response) {
			throw new AppError('Failed to update API token', 500);
		}
	} else {
		const response = await apiTokenRepo.createToken(
			hashedToken,
			device_id,
			device_name
		);
		if (!response) {
			throw new AppError('Failed to create API token', 500);
		}
	}

	return success(res, { api_key: rawToken }, 201);
});

const getTokenInfo = asyncHandler(async (req: Request, res: Response) => {
	const tokenData = req.apiToken!;

	const findToken = await apiTokenRepo.findToken({
		where: { token: tokenData.token },
	});

	if (!findToken) {
		throw new AppError('API token not found', 404);
	}

	const isExpired = new Date() > new Date(findToken.expiredAt);
	if (isExpired) {
		throw new AppError('API token has expired', 403);
	}

	const isUserExists = findToken.userId;
	if (!isUserExists) {
		throw new AppError('API token is not associated with any user', 403);
	}

	return success(res, {
		is_active: true,
		user_id: findToken.userId,
		device_name: findToken.deviceName,
		device_id: findToken.deviceId,
		expired_at: findToken.expiredAt,
	});
});

export default {
	createApiToken,
	getTokenInfo,
};
