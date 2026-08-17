import { z } from 'zod';

export const BlockTypeSchema = z.enum([
  'title',
  'text',
  'richtext',
  'image',
  'carousel',
  'map',
  'social-links',
  'spacer',
  'video',
]);

export const LayoutBlockSchema = z.object({
  blockId: z.string(),
  type: BlockTypeSchema,
  row: z.number(),
  col: z.number(),
  colSpan: z.number(),
  rowSpan: z.number().optional(),
  // Champs optionnels selon le type de bloc
  provider: z.string().optional(),
  address: z.string().optional(),
  embedUrl: z.string().optional(),
  height: z.string().optional(),
  // Champs style (utilisés par LayoutsSection)
  tag: z.string().optional(),
  display: z.string().optional(),
  shape: z.string().optional(),
  direction: z.string().optional(),
  size: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  bg: z.string().optional(),
  color: z.string().optional(),
  borderWidth: z.string().optional(),
  borderColor: z.string().optional(),
  borderRadius: z.string().optional(),
});

export const LayoutSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().max(60).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  blocks: z.array(LayoutBlockSchema),
});

export const LayoutsConfigSchema = z.object({
  layouts: z.record(z.string(), LayoutSchema),
});

export type BlockType = z.infer<typeof BlockTypeSchema>;
export type LayoutBlock = z.infer<typeof LayoutBlockSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type LayoutsConfig = z.infer<typeof LayoutsConfigSchema>;
