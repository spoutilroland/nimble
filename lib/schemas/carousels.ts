import { z } from 'zod';

export const CarouselEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  maxImages: z.number(),
  images: z.array(z.string()),
});

export const CarouselsConfigSchema = z.object({
  carousels: z.record(z.string(), CarouselEntrySchema),
});

export type CarouselEntry = z.infer<typeof CarouselEntrySchema>;
export type CarouselsConfig = z.infer<typeof CarouselsConfigSchema>;
