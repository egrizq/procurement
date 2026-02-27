import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import ApiTokenRepository from '#modules/api-token/token.repository.ts';
import AuthRepository from './auth.repository.ts';
import AppError from '#shared/utils/error.ts';
import { hashPassword, comparePassword } from '#shared/utils/password.ts';
import { hashToken } from '#modules/api-token/token.utils.ts';

const authRepo = new AuthRepository();
const apiTokenRepo = new ApiTokenRepository();

const register = asyncHandler(async (req: Request, res: Response) => {
	// validate if user already exists
	const userExists = await authRepo.findUser({ email: req.body.email });
	if (userExists) {
		throw new AppError('User already exists', 400);
	}

	// validate is username already exists
	const usernameExists = await authRepo.findUser({
		username: req.body.username,
	});
	if (usernameExists) {
		throw new AppError('Username already exists', 400);
	}

	// hash password
	const hashedPassword = await hashPassword(req.body.password);

	// create user
	const user = await authRepo.createUser({
		...req.body,
		password: hashedPassword,
	});
	if (!user) {
		throw new AppError('Failed to create user', 500);
	}

	// update token
	const tokenUpdated = await apiTokenRepo.updateToken(req.apiToken!.token, {
		userId: user.id,
	});
	if (!tokenUpdated) {
		throw new AppError('Failed to associate API token with user', 500);
	}

	return success(res, 'User registered successfully', 201);
});

const login = asyncHandler(async (req: Request, res: Response) => {
	const { email, password } = req.body;

	const user = await authRepo.findUser({ email: email });
	if (!user) {
		throw new AppError('Invalid email or password', 401);
	}

	const isPasswordValid = await comparePassword(password, user.password);
	if (!isPasswordValid) {
		throw new AppError('Invalid email or password', 401);
	}

	// get headers
	const apiKey = req.headers[process.env.API_TOKEN_SECRET as string];
	if (!apiKey || typeof apiKey !== 'string') {
		throw new AppError('API key required', 401);
	}

	// token validation
	const tokenHash = hashToken(apiKey);
	const token = await apiTokenRepo.findToken({
		where: { token: tokenHash, expiredAt: { gt: new Date() } },
	});
	if (!token) {
		throw new AppError('Invalid API key', 403);
	}

	// update token with user id
	const updatedToken = await apiTokenRepo.updateToken(token.token, {
		userId: user.id,
	});

	if (!updatedToken) {
		throw new AppError(
			'Failed to login!',
			500,
			'Failed to associate API token with user'
		);
	}

	return success(res, 'Login successful');
});

const logout = asyncHandler(async (req: Request, res: Response) => {
	const updatedToken = await apiTokenRepo.updateToken(req.apiToken!.token, {
		userId: null,
	});

	if (!updatedToken) {
		throw new AppError('Failed to disassociate API token from user', 500);
	}

	return success(res, 'Logout successful');
});

export default {
	register,
	login,
	logout,
};
