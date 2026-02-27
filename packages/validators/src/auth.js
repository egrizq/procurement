import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(1, 'Full name is required'),
    type: z.enum(['Admin', 'Office', 'Crew'], 'Invalid user type'),
    department: z.enum(['IT', 'HR', 'Finance', 'Deck', 'Engine'], 'Invalid department'),
    vesselId: z.number().optional(),
    position: z.string().optional(),
    status: z.enum(['Contract', 'Permanent', 'Intern', 'Leave'], 'Invalid status').optional(),
    leaveDate: z.date().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email or Password is wrong'),
    password: z.string().min(6, 'Email or Password is wrong'),
  }),
});
