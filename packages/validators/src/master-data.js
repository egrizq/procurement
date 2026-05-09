import { z } from 'zod';

export const getMasterSchema = z.object({
  body: z.object({
    page: z.number().min(1, 'Page number must be at least 1').optional(),
    limit: z.number().min(1, 'Limit must be at least 1').optional(),
    search: z.string().optional(),
  }),
});

export const addVendorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.number(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format'),
    city: z.string().optional(),
  }),
});

export const addItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    categoryId: z.number().int().positive('Category is required'),
    unit: z.enum(['Pcs', 'Box', 'Liter', 'Meter', 'Kg']),
    status: z.enum(['Publish', 'Unpublish']).optional().default('Publish'),
    description: z.string().optional().nullable(),
  }),
});

export const updateItemSchema = addItemSchema;
