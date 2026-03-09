import { z } from 'zod';

export const BusinessHoursSchema = z.object({
  weekdays: z.string(),
  saturday: z.string(),
  note: z.string(),
});

export const BusinessLegalSchema = z.object({
  siret: z.string(),
  certifications: z.string(),
  copyright: z.string(),
});

export const BusinessInfoSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  hours: BusinessHoursSchema,
  legal: BusinessLegalSchema,
});

export const SEOConfigSchema = z.object({
  defaultTitle: z.string(),
  defaultDescription: z.string(),
  ogImage: z.string().nullable(),
});

export const FontConfigSchema = z.object({
  heading: z.string(),
  body: z.string(),
  googleFontsUrl: z.string(),
});

export const CaptchaConfigSchema = z.object({
  provider: z.enum(['turnstile', 'recaptcha', 'hcaptcha', 'none', '']),
  siteKey: z.string(),
  secretKey: z.string().optional(),
});

export const MailConfigSchema = z.object({
  enabled: z.boolean(),
  host: z.string(),
  port: z.number(),
  secure: z.boolean(),
  user: z.string(),
  pass: z.string(),
  from: z.string(),
  to: z.string(),
});

export const CustomRadiusSchema = z.object({
  tl: z.number(),
  tr: z.number(),
  br: z.number(),
  bl: z.number(),
});

export const DesignConfigSchema = z.object({
  borderStyle: z.string(),
  customRadius: CustomRadiusSchema.optional(),
});

export const SocialLinksSchema = z.object({
  linkedin: z.string(),
  facebook: z.string(),
  instagram: z.string(),
  x: z.string(),
  tiktok: z.string(),
  youtube: z.string(),
  pinterest: z.string(),
  github: z.string(),
});

export const SocialLabelsSchema = z.object({
  linkedin: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  x: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  pinterest: z.string().optional(),
  github: z.string().optional(),
});

export const FooterBlockTypeEnum = z.enum([
  'logo-desc', 'contact', 'hours', 'legal', 'richtext', 'social-links', 'map',
]);

export const FooterBlockSchema = z.object({
  blockId: z.string(),
  type: FooterBlockTypeEnum,
  row: z.number(),
  col: z.number(),
  colSpan: z.number(),
  // social-links options
  shape: z.string().optional(),
  direction: z.string().optional(),
  size: z.string().optional(),
  // map options
  provider: z.string().optional(),
  address: z.string().optional(),
  embedUrl: z.string().optional(),
  height: z.string().optional(),
});

export const FooterConfigSchema = z.object({
  cols: z.number(),
  blocks: z.array(FooterBlockSchema),
});

export const LanguagesConfigSchema = z.object({
  available: z.array(z.string()),
  default: z.string(),
});

export const SiteConfigSchema = z.object({
  business: BusinessInfoSchema,
  seo: SEOConfigSchema,
  fonts: FontConfigSchema,
  captcha: CaptchaConfigSchema,
  design: DesignConfigSchema,
  logoMode: z.enum(['logo-only', 'logo-name', 'name-only']),
  logoPosition: z.enum(['left', 'center', 'right']),
  languages: LanguagesConfigSchema,
  social: SocialLinksSchema,
  socialLabels: SocialLabelsSchema.optional(),
  footer: FooterConfigSchema,
  mail: MailConfigSchema.optional(),
  homepageRedirect: z.string().optional(),
});

export type BusinessHours = z.infer<typeof BusinessHoursSchema>;
export type BusinessLegal = z.infer<typeof BusinessLegalSchema>;
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;
export type SEOConfig = z.infer<typeof SEOConfigSchema>;
export type FontConfig = z.infer<typeof FontConfigSchema>;
export type CaptchaConfig = z.infer<typeof CaptchaConfigSchema>;
export type CaptchaProvider = CaptchaConfig['provider'];
export type MailConfig = z.infer<typeof MailConfigSchema>;
export type CustomRadius = z.infer<typeof CustomRadiusSchema>;
export type DesignConfig = z.infer<typeof DesignConfigSchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type SocialLabels = z.infer<typeof SocialLabelsSchema>;
export type FooterBlockType = z.infer<typeof FooterBlockTypeEnum>;
export type FooterBlock = z.infer<typeof FooterBlockSchema>;
export type FooterConfig = z.infer<typeof FooterConfigSchema>;
export type LanguagesConfig = z.infer<typeof LanguagesConfigSchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;
