import type { SectionType } from '@/lib/types/pages';

export interface SidebarField {
  key: string;
  labelKey: string;
  type: 'text' | 'textarea';
}

export interface SectionFieldDef {
  fields: SidebarField[];
  hasCarousel: boolean;
  specialEditor?: 'bento-grid';
}

const SECTION_FIELDS: Record<string, SectionFieldDef> = {
  hero: {
    fields: [
      { key: 'hero-title', labelKey: 'sidebar.heroTitle', type: 'text' },
      { key: 'hero-subtitle', labelKey: 'sidebar.heroSubtitle', type: 'textarea' },
    ],
    hasCarousel: true,
  },
  'hero-simple': {
    fields: [
      { key: 'hero-title', labelKey: 'sidebar.heroTitle', type: 'text' },
      { key: 'hero-subtitle', labelKey: 'sidebar.heroSubtitle', type: 'textarea' },
    ],
    hasCarousel: true,
  },
  about: {
    fields: [
      { key: 'about-title', labelKey: 'sidebar.aboutTitle', type: 'text' },
      { key: 'about-p1', labelKey: 'sidebar.aboutP1', type: 'textarea' },
      { key: 'about-p2', labelKey: 'sidebar.aboutP2', type: 'textarea' },
      { key: 'feature-1-title', labelKey: 'sidebar.feature1Title', type: 'text' },
      { key: 'feature-1-desc', labelKey: 'sidebar.feature1Desc', type: 'textarea' },
      { key: 'feature-2-title', labelKey: 'sidebar.feature2Title', type: 'text' },
      { key: 'feature-2-desc', labelKey: 'sidebar.feature2Desc', type: 'textarea' },
      { key: 'feature-3-title', labelKey: 'sidebar.feature3Title', type: 'text' },
      { key: 'feature-3-desc', labelKey: 'sidebar.feature3Desc', type: 'textarea' },
    ],
    hasCarousel: false,
  },
  services: {
    fields: [
      { key: 'services-title', labelKey: 'sidebar.servicesTitle', type: 'text' },
      { key: 'service-1-title', labelKey: 'sidebar.service1Title', type: 'text' },
      { key: 'service-1-desc', labelKey: 'sidebar.service1Desc', type: 'textarea' },
      { key: 'service-2-title', labelKey: 'sidebar.service2Title', type: 'text' },
      { key: 'service-2-desc', labelKey: 'sidebar.service2Desc', type: 'textarea' },
      { key: 'service-3-title', labelKey: 'sidebar.service3Title', type: 'text' },
      { key: 'service-3-desc', labelKey: 'sidebar.service3Desc', type: 'textarea' },
      { key: 'service-4-title', labelKey: 'sidebar.service4Title', type: 'text' },
      { key: 'service-4-desc', labelKey: 'sidebar.service4Desc', type: 'textarea' },
    ],
    hasCarousel: false,
  },
  gallery: {
    fields: [
      { key: 'gallery-title', labelKey: 'sidebar.galleryTitle', type: 'text' },
    ],
    hasCarousel: true,
  },
  contact: {
    fields: [
      { key: 'contact-title', labelKey: 'sidebar.contactTitle', type: 'text' },
    ],
    hasCarousel: false,
  },
  'bento-grid': {
    fields: [],
    hasCarousel: false,
    specialEditor: 'bento-grid',
  },
  'cinematic-split': {
    fields: [
      { key: 's2-tag', labelKey: 'sidebar.cinematicTag', type: 'text' },
      { key: 's2-title', labelKey: 'sidebar.cinematicTitle', type: 'text' },
    ],
    hasCarousel: true,
  },
  polaroids: {
    fields: [
      { key: 's3-tag', labelKey: 'sidebar.polaroidsTag', type: 'text' },
      { key: 's3-title', labelKey: 'sidebar.polaroidsTitle', type: 'text' },
    ],
    hasCarousel: true,
  },
  stats: {
    fields: [],
    hasCarousel: false,
  },
  'custom-layout': {
    fields: [],
    hasCarousel: true,
  },
};

export function getSectionFields(type: SectionType): SectionFieldDef {
  return SECTION_FIELDS[type] ?? { fields: [], hasCarousel: false };
}
