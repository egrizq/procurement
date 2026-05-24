import { z } from 'zod';

export const createPOSchema = z.object({
  body: z.object({
    mocId: z.number().int().positive('MOC ID is required'),
    vendorId: z.number().int().positive('Vendor ID is required'),
    vesselRequestItemId: z.number().int().positive('Item ID is required'),
    unitPrice: z.number().positive('Unit price must be greater than 0'),
    qty: z.number().int().positive('Quantity must be greater than 0'),
    notes: z.string().optional().nullable(),
  }),
});

export const poListSchema = z.object({
  body: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(10),
    search: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const poByIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const approvePOSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const rejectPOSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    rejectionReason: z.string().min(1, 'Rejection reason is required'),
  }),
});
