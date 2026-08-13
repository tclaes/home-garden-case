import { z } from 'zod/v4';
import { userResponseSchema } from './user.schema.js';

export const registerSchema = z.object({
  firstName: z.string().trim().nullable().optional(),
  lastName: z.string().nullable().optional(),
  age: z.number().int().positive('Age must be a positive integer').nullable().optional(),
  emailAddress: z
    .email('Invalid email address format')
    .min(1, 'Email address is required')
    .trim()
    .toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

z.globalRegistry.add(registerSchema, { id: 'Register' });

export const loginSchema = z.object({
  emailAddress: z
    .email('Invalid email address format')
    .min(1, 'Email address is required')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

z.globalRegistry.add(loginSchema, { id: 'Login' });

export const authResponseSchema = z.object({
  token: z.string(),
  user: userResponseSchema,
});

z.globalRegistry.add(authResponseSchema, { id: 'Auth' });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
