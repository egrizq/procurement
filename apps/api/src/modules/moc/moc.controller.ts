import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import MocRepository from './moc.repository.ts';

const createMoc = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.apiToken!.userId;
  const data = req.body;

  const mocRepo = new MocRepository();
  const newMoc = await mocRepo.createMoc(data, userId);

  return success(res, { moc: newMoc }, 201);
});

const getMocs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = '', status } = req.body;

  const mocRepo = new MocRepository();
  const result = await mocRepo.getMocs(Number(page), Number(limit), search, status);
  const pagination = getPaginationMeta(Number(page), Number(limit), result.total);

  return success(res, {
    mocs: result.items,
    pagination,
  });
});

const getMocById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const mocRepo = new MocRepository();
  const moc = await mocRepo.getMocById(Number(id));

  if (!moc) {
    throw new AppError('MOC not found', 404);
  }

  return success(res, { moc });
});

const updateMoc = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const mocRepo = new MocRepository();
  const updatedMoc = await mocRepo.updateMoc(Number(id), data);

  return success(res, { moc: updatedMoc });
});

const deleteMoc = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const mocRepo = new MocRepository();
  await mocRepo.deleteMoc(Number(id));

  return success(res, { message: 'MOC deleted successfully' });
});

export default {
  createMoc,
  getMocs,
  getMocById,
  updateMoc,
  deleteMoc,
};
