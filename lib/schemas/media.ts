import { z } from 'zod';

export const MediaEntrySchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  hasWebp: z.boolean(),
  uploadedAt: z.string(),
});

export const MediaRegistrySchema = z.object({
  media: z.record(z.string(), MediaEntrySchema),
});

export const MediaUrlsSchema = z.object({
  filename: z.string(),
  url: z.string(),
  webpUrl: z.string().nullable(),
});

export type MediaEntry = z.infer<typeof MediaEntrySchema>;
export type MediaRegistry = z.infer<typeof MediaRegistrySchema>;
export type MediaUrls = z.infer<typeof MediaUrlsSchema>;
