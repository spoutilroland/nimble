import { z } from 'zod';

export const SessionDataSchema = z.object({
  user: z.string().optional(),
  isLoggedIn: z.boolean(),
});

export const AdminDataSchema = z.object({
  passwordHash: z.string(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;
export type AdminData = z.infer<typeof AdminDataSchema>;
