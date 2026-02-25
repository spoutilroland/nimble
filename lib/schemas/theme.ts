import { z } from 'zod';

export const ThemeVarsSchema = z.object({
  '--primary': z.string(),
  '--primary-dark': z.string(),
  '--primary-light': z.string(),
  '--secondary': z.string(),
  '--secondary-dark': z.string(),
  '--accent': z.string(),
  '--accent-dark': z.string(),
  '--bg': z.string(),
  '--bg-light': z.string(),
  '--text': z.string(),
  '--text-muted': z.string(),
});

export const CustomThemeSchema = z.object({
  label: z.string(),
  vars: ThemeVarsSchema,
});

export const ThemeConfigSchema = z.object({
  theme: z.string(),
  customThemes: z.record(z.string(), CustomThemeSchema),
});

export type ThemeVars = z.infer<typeof ThemeVarsSchema>;
export type CustomTheme = z.infer<typeof CustomThemeSchema>;
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
