import { z } from 'zod';
import { periodEnum } from '../../../db/schema/enums.ts';

export const getStandardsSchema = z.object({
	body: z.object({
		page: z.number().min(1, 'Page number must be at least 1').optional(),
		limit: z.number().min(1, 'Limit must be at least 1').optional(),
		search: z.string().optional(),
	}),
});

export const createStandardSchema = z.object({
	body: z.object({
		vesselId: z.number('Vessel is required').positive(),
		itemId: z.number('Item is required').positive(),
		periode: z.enum(periodEnum, { message: 'Periode is required' }),
		minStock: z.number('Min stock is required').min(0),
		maxStock: z.number('Max stock is required').min(0),
	}),
});

export const updateStandardSchema = z.object({
	params: z.object({
		id: z.string(),
	}),
	body: z.object({
		vesselId: z.number().int().positive().optional(),
		itemId: z.number().int().positive().optional(),
		periode: z.enum(periodEnum).optional(),
		minStock: z.number().min(0).optional(),
		maxStock: z.number().min(0).optional(),
	}),
});

export const standardByIdSchema = z.object({
	params: z.object({
		id: z.string(),
	}),
});