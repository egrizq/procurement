import { z } from 'zod';

export const mocSchema = z.object({
  body: z
    .object({
      vesselRequestId: z.number().int().positive(),
      vesselRequestItemId: z.number().int().positive(),
      status: z.enum(['Draft', 'Completed', 'Approved']).default('Draft'),
      selectedVendorId: z.number().int().positive().optional().nullable(),
      vendors: z.array(
        z.object({
          vendorId: z.number().int().positive('Please select a vendor'),
          unitPrice: z.number().int().nonnegative().optional().default(0),
          availableQty: z.number().int().nonnegative().optional().default(0),
          warranty: z.number().int().nonnegative().optional().default(0),
          discount: z.number().int().min(0).max(100).optional().default(0),
          remarks: z.string().optional().nullable(),
          isSelected: z.boolean().default(false),
          sawScore: z.number().optional().nullable(),
        })
      ),
    })
    .superRefine((val, ctx) => {
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
      const vendorIds = vendors.map((v) => v.vendorId).filter(Boolean);
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
          if (v.availableQty === undefined || v.availableQty === null || v.availableQty <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Available qty must be greater than 0',
              path: ['vendors', idx, 'availableQty'],
            });
          }
        });
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
