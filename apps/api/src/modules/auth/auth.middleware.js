import AppError from '#shared/utils/error.ts';
import { hashToken } from '#modules/api-token/token.utils.js';
import ApiTokenRepository from '#modules/api-token/token.repository.js';

const apiAuth = () => {
	return async (req, res, next) => {
		const apiKey = req.headers[process.env.API_TOKEN_SECRET];

		if (!apiKey) {
			throw new AppError("API key required", 401);
		}

		const tokenHash = hashToken(apiKey);
		const apiTokenRepo = new ApiTokenRepository();
		const token = await apiTokenRepo.findToken({
			where: { token: tokenHash, expiredAt: { gt: new Date() } },
		});
		if (!token || !token.userId) {
			throw new AppError("Login first!", 403);
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
