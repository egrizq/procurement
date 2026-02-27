import { z } from 'zod';

export const createApiTokenSchema = z.object({
  body: z.object({
    device_name: z.string().min(2, 'Device name must be at least 2 characters long'),
    device_id: z.string().min(2, 'Device ID must be at least 2 characters long'),
  }),
});
