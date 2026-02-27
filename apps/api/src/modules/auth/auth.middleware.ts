import type { Request, Response, NextFunction } from 'express';
import AppError from '#shared/utils/error.ts';
import { hashToken } from '#modules/api-token/token.utils.ts';
import ApiTokenRepository from '#modules/api-token/token.repository.js';

interface ApiTokenData {
	id: number;
	userId: number;
	token: string;
	expiredAt: Date;
}

// Extend Express Request to include apiToken
declare global {
	namespace Express {
		interface Request {
			apiToken?: ApiTokenData;
		}
	}
}

const apiAuth = () => {
	return async (req: Request, _res: Response, next: NextFunction) => {
		const apiKey = req.headers[process.env.API_TOKEN_SECRET as string];

		if (!apiKey || typeof apiKey !== 'string') {
			throw new AppError('API key required', 401);
		}

		const tokenHash = hashToken(apiKey);
		const apiTokenRepo = new ApiTokenRepository();
		const token = await apiTokenRepo.findToken({
			where: { token: tokenHash, expiredAt: { gt: new Date() } },
		});
		if (!token || !token.userId) {
			throw new AppError('Login first!', 403);
		}

		req.apiToken = {
			id: token.id,
			userId: token.userId,
			token: token.token,
			expiredAt: token.expiredAt,
		};

		next();
	};
};

export default apiAuth;
