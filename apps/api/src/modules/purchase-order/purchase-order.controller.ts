import type { Request, Response } from 'express';
import asyncHandler from '#shared/utils/asyncHandler.ts';
import { success } from '#shared/utils/response.ts';
import AppError from '#shared/utils/error.ts';
import getPaginationMeta from '#shared/utils/paginate.ts';
import PurchaseOrderRepository from './purchase-order.repository.ts';
import db from '../../config/drizzle';
import { mocs } from '../../db/schema/index.ts';
import { eq } from 'drizzle-orm';
import { generatePurchaseOrderPdf } from './purchase-order.pdf.ts';

const poRepo = new PurchaseOrderRepository();

const createPO = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.apiToken!.userId;
  const { mocId, vendorId, vesselRequestItemId, unitPrice, qty, notes } = req.body;

  // Fetch MOC to get item info for threshold check
  const moc = await db.query.mocs.findFirst({
    where: eq(mocs.id, mocId),
    with: { vesselRequestItem: { with: { item: { columns: { id: true } } } } },
  });
  if (!moc) throw new AppError('MOC not found', 404);
  if (moc.status === 'Approved') throw new AppError('A Purchase Order already exists for this MOC', 400);

  const itemId = moc.vesselRequestItem?.item?.id;
  if (!itemId) throw new AppError('Could not resolve item from MOC', 400);

  try {
    const po = await poRepo.createPO({
      mocId,
      vendorId,
      vesselRequestItemId,
      unitPrice,
      qty,
      notes,
      itemId,
      createdBy: userId,
    });
    return success(res, { purchaseOrder: po }, 201);
  } catch (err: any) {
    throw new AppError(err.message || 'Failed to create Purchase Order', 400);
  }
});

const getPOs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = '', status } = req.body;

  const result = await poRepo.getPOs(Number(page), Number(limit), search, status);
  const pagination = getPaginationMeta(Number(page), Number(limit), result.total);

  return success(res, { purchaseOrders: result.items, pagination });
});

const getPOById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const po = await poRepo.getPOById(Number(id));
  if (!po) throw new AppError('Purchase Order not found', 404);
  return success(res, { purchaseOrder: po });
});

const approvePO = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.apiToken!.userId;
  const { id } = req.params;

  try {
    const po = await poRepo.approvePO(Number(id), userId);
    return success(res, { purchaseOrder: po });
  } catch (err: any) {
    throw new AppError(err.message || 'Failed to approve Purchase Order', 400);
  }
});

const rejectPO = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.apiToken!.userId;
  const { id } = req.params;
  const { rejectionReason } = req.body;

  try {
    const po = await poRepo.rejectPO(Number(id), userId, rejectionReason);
    return success(res, { purchaseOrder: po });
  } catch (err: any) {
    throw new AppError(err.message || 'Failed to reject Purchase Order', 400);
  }
});

const generatePdf = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('Invalid purchase order ID', 400);
  }

  const po = await poRepo.getPOById(id);
  if (!po) {
    throw new AppError('Purchase Order not found', 404);
  }

  const pdfBuffer = await generatePurchaseOrderPdf(po);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=PurchaseOrder-${po.poNumber}.pdf`
  );

  res.send(pdfBuffer);
});

export default { createPO, getPOs, getPOById, approvePO, rejectPO, generatePdf };
