import type { BlockType } from '@/lib/schemas/layouts';
import type { FooterBlockType } from '@/lib/types';

export interface LayoutBlockTypeDef {
  type: BlockType;
  labelKey: string;
  icon: string;
}

export const LAYOUT_BLOCK_TYPES: LayoutBlockTypeDef[] = [
  { type: 'title', labelKey: 'block.title', icon: 'T' },
  { type: 'richtext', labelKey: 'block.richtext', icon: '\u00B6' },
  { type: 'image', labelKey: 'block.image', icon: '\uD83D\uDDBC' },
  { type: 'carousel', labelKey: 'block.carousel', icon: '\u25EB' },
  { type: 'social-links', labelKey: 'block.socialLinks', icon: '\u25C9' },
  { type: 'map', labelKey: 'block.map', icon: '\uD83D\uDDFA' },
];

export interface FooterBlockTypeDef {
  type: FooterBlockType;
  labelKey: string;
  icon: string;
}

export const FOOTER_BLOCK_TYPES: FooterBlockTypeDef[] = [
  { type: 'logo-desc', labelKey: 'footerSection.blockLogoDesc', icon: '\uD83C\uDFE0' },
  { type: 'contact', labelKey: 'footerSection.blockContact', icon: '\uD83D\uDCDE' },
  { type: 'hours', labelKey: 'footerSection.blockHours', icon: '\uD83D\uDD50' },
  { type: 'legal', labelKey: 'footerSection.blockLegal', icon: '\u2696' },
  { type: 'richtext', labelKey: 'footerSection.blockRichtext', icon: '\u00B6' },
  { type: 'social-links', labelKey: 'footerSection.blockSocialLinks', icon: '\u25C9' },
  { type: 'map', labelKey: 'footerSection.blockMap', icon: '\uD83D\uDDFA' },
];
