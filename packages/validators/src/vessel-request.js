import { z } from 'zod';

export const vesselRequestSchema = z.object({
  body: z.object({
    vesselId: z.number('Vessel is not found').int().positive(),
    status: z.enum(
      ['Ok', 'Waiting', 'Approved', 'Rejected'],
      'Status must be either Ok, Waiting, Approved, or Rejected'
    ),
    priority: z.enum(['Low', 'Medium', 'High'], 'Priority must be either Low, Medium, or High'),
    justification: z.string().optional(),
    requestDate: z.string('Request date must is not valid'),
    items: z
      .array(
        z.object({
          itemId: z.number('Item is not found').int().positive(),
          qtyRequested: z.number('Quantity requested is not valid').int().positive(),
          unit: z.enum(
            ['Pcs', 'Box', 'Liter', 'Meter', 'Kg'],
            'Unit must be either Pcs, Box, Liter, Meter, or Kg'
          ),
          status: z.enum(
            ['Ok', 'Waiting', 'Approved', 'Rejected'],
            'Status must be either Ok, Waiting, Approved, or Rejected'
          ),
          priority: z.enum(['Low', 'Medium', 'High'], 'Priority must be either Low, Medium, or High'),
          justification: z.string().optional(),
        })
      )
      .min(1, 'Items are required')
      .refine(
        (items) => {
          const itemIds = items.map((item) => item.itemId);
          return new Set(itemIds).size === itemIds.length;
        },
        {
          message: 'Items must be unique within a single request',
        }
      ),
  }),
});

export const vesselRequestListSchema = z.object({
  body: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(10),
    search: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const vesselRequestByIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const updateVesselRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    vesselId: z.number('Vessel is not found').int().positive(),
    status: z.enum(
      ['Ok', 'Waiting', 'Approved', 'Rejected'],
      'Status must be either Ok, Waiting, Approved, or Rejected'
    ),
    items: z.array(
      z.object({
        itemId: z.number('Item is not found').int().positive(),
        qtyApproved: z.number('Quantity approved is not valid').int().positive(),
        unit: z.enum(
          ['Pcs', 'Box', 'Liter', 'Meter', 'Kg'],
          'Unit must be either Pcs, Box, Liter, Meter, or Kg'
        ),
        status: z.enum(
          ['Ok', 'Waiting', 'Approved', 'Rejected'],
          'Status must be either Ok, Waiting, Approved, or Rejected'
        ),
        justification: z.string().optional(),
      }),
      'Items is required'
    ),
  }),
});

export const reviewVesselRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    action: z.enum(['Approve', 'Reject'], 'Action must be either Approve or Reject'),
    rejectReason: z.string().optional(),
    itemsAdjustment: z.array(
      z.object({
        itemId: z.number('Item is not found').int().positive(),
        qtyApproved: z.number('Quantity approved is not valid').int().nonnegative(),
        staffJustification: z.string().optional(),
      })
    ).optional(),
  }).refine((data) => {
    if (data.action === 'Reject' && !data.rejectReason) {
      return false;
    }
    return true;
  }, {
    message: 'Reject reason is required when rejecting a request',
    path: ['rejectReason'],
  }),
});
