import { z } from 'zod';

export const mocSchema = z.object({
  body: z.object({
    vesselRequestId: z.number().int().positive(),
    vesselRequestItemId: z.number().int().positive(),
    status: z.enum(['Draft', 'Completed']).default('Draft'),
    vendors: z.array(
      z.object({
        vendorId: z.number().int().positive('Please select a vendor'),
        unitPrice: z.number().int().nonnegative().optional().default(0),
        leadTime: z.string().optional().default(''),
        remarks: z.string().optional().nullable(),
        isSelected: z.boolean().default(false),
      })
    )
  }).superRefine((val, ctx) => {
    const { status, vendors } = val;

    // 1. Validate vendor list is not empty
    if (!vendors || vendors.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least 1 vendor is required',
        path: ['vendors'],
      });
      return;
    }

    // 2. Validate unique vendor IDs
    const vendorIds = vendors.map(v => v.vendorId).filter(Boolean);
    if (new Set(vendorIds).size !== vendorIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vendors must be unique within comparison matrix',
        path: ['vendors'],
      });
    }

    // 3. Status-specific checks
    if (status === 'Completed') {
      if (vendors.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least 3 vendors must be selected for comparison to complete the MOC',
          path: ['vendors'],
        });
      }

      vendors.forEach((v, idx) => {
        if (!v.vendorId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Vendor is required',
            path: ['vendors', idx, 'vendorId'],
          });
        }
        if (!v.unitPrice || v.unitPrice <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Unit price must be greater than 0',
            path: ['vendors', idx, 'unitPrice'],
          });
        }
        if (!v.leadTime || !v.leadTime.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Lead time is required',
            path: ['vendors', idx, 'leadTime'],
          });
        }
      });

      const selectedWinners = vendors.filter(v => v.isSelected);
      if (selectedWinners.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Exactly one vendor must be selected as winner to complete the MOC',
          path: ['vendors'],
        });
      }
    }
  }),
});

export const mocListSchema = z.object({
  body: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(10),
    search: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const mocByIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});
