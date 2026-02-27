import { z } from 'zod';

export const SectionTypeSchema = z.enum([
  'hero',
  'hero-simple',
  'about',
  'services',
  'gallery',
  'contact',
  'bento-grid',
  'cinematic-split',
  'polaroids',
  'stats',
  'custom-layout',
]);

export const DividerConfigSchema = z.object({
  type: z.enum(['wave', 'wave-double', 'triangle', 'diagonal', 'curve', 'zigzag', 'torn', 'none']),
  color: z.string(),
  flip: z.boolean().optional(),
});

export const SectionSchema = z.object({
  type: SectionTypeSchema,
  carouselId: z.string().optional(),
  layoutId: z.string().optional(),
  blockCarousels: z.record(z.string(), z.string()).optional(),
  dividerAfter: DividerConfigSchema.optional(),
  // Propriétés spécifiques au type de section (stats, polaroids, etc.)
  props: z.record(z.string(), z.unknown()).optional(),
});

export const PageSEOSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogImage: z.string().nullable(),
});

export const PageDataSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  showInNav: z.boolean(),
  navOrder: z.number(),
  seo: PageSEOSchema,
  sections: z.array(SectionSchema),
});

export const PagesConfigSchema = z.object({
  pages: z.array(PageDataSchema),
});

export type SectionType = z.infer<typeof SectionTypeSchema>;
export type DividerConfig = z.infer<typeof DividerConfigSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type PageSEO = z.infer<typeof PageSEOSchema>;
export type PageData = z.infer<typeof PageDataSchema>;
export type PagesConfig = z.infer<typeof PagesConfigSchema>;
