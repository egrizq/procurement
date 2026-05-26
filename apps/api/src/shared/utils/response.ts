import type { Response } from "express";

export const success = <T = unknown>(
	res: Response,
	data: T,
	statusCode: number = 200,
) => {
	return res.status(statusCode).json({
		success: true,
		data,
	});
};

export const error = (
	res: Response,
	message: string,
	statusCode: number = 500,
	errors: unknown = null,
) => {
	return res.status(statusCode).json({
		success: false,
		error: message,
		errors,
	});
};
