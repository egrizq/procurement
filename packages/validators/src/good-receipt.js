import { z } from 'zod';

export const createGoodReceiptSchema = z.object({
  body: z.object({
    purchaseOrderId: z.number().int().positive('Purchase Order ID is required'),
    isSameItem: z.boolean({
      required_error: 'Checklist status is required',
    }),
    reason: z.string().optional().nullable(),
  }).refine(
    (data) => {
      if (!data.isSameItem && (!data.reason || !data.reason.trim())) {
        return false;
      }
      return true;
    },
    {
      message: 'Reason is required when item does not match',
      path: ['reason'],
    }
  ),
});

export const goodReceiptListSchema = z.object({
  body: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(10),
    search: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const goodReceiptByIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});
