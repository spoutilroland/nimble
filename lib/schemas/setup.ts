import { z } from 'zod';

export const SetupConfigSchema = z.object({
  setupDone: z.boolean(),
  adminSlug: z.string(),
});

export type SetupConfig = z.infer<typeof SetupConfigSchema>;
