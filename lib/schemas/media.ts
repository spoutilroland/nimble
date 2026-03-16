import { z } from 'zod';

export const MediaEntrySchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  hasWebp: z.boolean(),
  hasThumb: z.boolean().optional(),
  uploadedAt: z.string(),
  altText: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fileSize: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  folderId: z.string().optional(),
});

export const MediaFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export const MediaRegistrySchema = z.object({
  media: z.record(z.string(), MediaEntrySchema),
  folders: z.record(z.string(), MediaFolderSchema).optional(),
});

export const MediaUrlsSchema = z.object({
  filename: z.string(),
  url: z.string(),
  webpUrl: z.string().nullable(),
  thumbUrl: z.string().nullable(),
});

export const MediaUsageSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export const MediaItemWithMetaSchema = MediaEntrySchema.extend({
  url: z.string(),
  webpUrl: z.string().nullable(),
  thumbUrl: z.string().nullable(),
  usedIn: z.array(MediaUsageSchema),
});

export type MediaEntry = z.infer<typeof MediaEntrySchema>;
export type MediaFolder = z.infer<typeof MediaFolderSchema>;
export type MediaRegistry = z.infer<typeof MediaRegistrySchema>;
export type MediaUrls = z.infer<typeof MediaUrlsSchema>;
export type MediaUsage = z.infer<typeof MediaUsageSchema>;
export type MediaItemWithMeta = z.infer<typeof MediaItemWithMetaSchema>;
