import { z } from 'zod';

export const getMasterSchema = z.object({
	body: z.object({
		page: z.number().min(1, 'Page number must be at least 1').optional(),
		limit: z.number().min(1, 'Limit must be at least 1').optional(),
		search: z.string().optional(),
	}),
});

export const createVesselStockSchema = z.object({
	body: z.object({
		vesselId: z.number('Vessel is required').positive(),
		itemId: z.number('Item is required').positive(),
		stockOnHand: z.number('Stock on hand is required').min(0, 'Stock on hand cannot be negative'),
		stockMinimal: z.number('Minimum stock is required').min(0, 'Minimum stock cannot be negative'),
		lastUpdate: z.string('Last update date is required'),
	}),
});

export const updateVesselStockSchema = z.object({
	params: z.object({
		id: z.string(),
	}),
	body: z.object({
		vesselId: z.number().int().positive().optional(),
		itemId: z.number().int().positive().optional(),
		stockOnHand: z.number().int().min(0).optional(),
		stockMinimal: z.number().int().min(0).optional(),
		lastUpdate: z.string().optional(),
	}),
});

export const vesselStockByIdSchema = z.object({
	params: z.object({
		id: z.string(),
	}),
});
