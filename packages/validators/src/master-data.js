import { z } from 'zod';

export const getMasterSchema = z.object({
  body: z.object({
    page: z.number().min(1, 'Page number must be at least 1').optional(),
    limit: z.number().min(1, 'Limit must be at least 1').optional(),
    search: z.string().optional(),
  }),
});
