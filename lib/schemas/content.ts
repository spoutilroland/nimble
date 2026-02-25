import { z } from 'zod';

export const ContentDataSchema = z.record(
  z.string(),
  z.record(z.string(), z.record(z.string(), z.string()))
);

export type ContentData = z.infer<typeof ContentDataSchema>;
