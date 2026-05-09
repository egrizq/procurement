import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import CategoryRepository from './category.repository.ts';

const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10, page = 1, search = '' } = req.body;

    const categoryRepo = new CategoryRepository();
    const result = await categoryRepo.getCategories(page, limit, search);

    if (!result.categories || result.categories.length === 0) {
        throw new AppError('Categories not found', 404);
    }

    const pagination = getPaginationMeta(page, limit, result.total);

    return success(res, {
        items: result.categories,
        pagination,
        meta: {
            search: search || null,
            sort_by: 'createdAt',
            sort_order: 'desc',
            filters_applied: {},
        },
    });
});

export default {
    getCategories,
};