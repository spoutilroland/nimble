import type { ComponentType } from 'react';
import type { TabId } from '@/lib/admin/store';

export interface SectionDescriptor {
  id: string;
  tab: TabId;
  order: number;
  anchor: string;
  labelKey: string;
  component: ComponentType;
  wrapper?: string;
}

// Import dynamique via lazy serait possible mais les sections sont déjà 'use client'
// et toutes montent au switch de tab, donc pas de gain réel.
import { ThemeSection } from '@/components/admin/sections/ThemeSection/index';
import { LogoSection } from '@/components/admin/sections/LogoSection/index';
import { BorderSection } from '@/components/admin/sections/BorderSection/index';
import { SiteSection } from '@/components/admin/sections/SiteSection';
import { SocialSection } from '@/components/admin/sections/SocialSection';
import { SecuritySection } from '@/components/admin/sections/SecuritySection';
import { CaptchaSection } from '@/components/admin/sections/CaptchaSection';
import { ConfigSection } from '@/components/admin/sections/ConfigSection';
import { SnapshotsSection } from '@/components/admin/sections/SnapshotsSection/index';
import { FooterSection } from '@/components/admin/sections/FooterSection/index';
import { PagesSection } from '@/components/admin/sections/PagesSection/index';
import { LayoutsSection } from '@/components/admin/sections/LayoutsSection/index';
import { ExportSection } from '@/components/admin/sections/ExportSection/index';
import { MediaLibrarySection } from '@/components/admin/sections/MediaLibrarySection/index';
import { ContactReplySection } from '@/components/admin/sections/ContactReplySection';
import { BackupSection } from '@/components/admin/sections/BackupSection/index';

const SECTION_REGISTRY: SectionDescriptor[] = [
  // tab-design
  { id: 'theme', tab: 'tab-design', order: 0, anchor: 'theme-section', labelKey: 'nav.themes', component: ThemeSection },
  { id: 'logo', tab: 'tab-design', order: 1, anchor: 'logo-section', labelKey: 'nav.logoFavicon', component: LogoSection },
  { id: 'border', tab: 'tab-design', order: 2, anchor: 'border-section', labelKey: 'nav.borders', component: BorderSection },

  // tab-content
  { id: 'pages', tab: 'tab-content', order: 0, anchor: 'pages-section', labelKey: 'nav.pages', component: PagesSection },
  { id: 'layouts', tab: 'tab-content', order: 1, anchor: 'layouts-section', labelKey: 'nav.layouts', component: LayoutsSection },

  // tab-media
  { id: 'media-library', tab: 'tab-media', order: 0, anchor: 'media-library-section', labelKey: 'nav.media', component: MediaLibrarySection },

  // tab-identity
  { id: 'site', tab: 'tab-identity', order: 0, anchor: 'site-section', labelKey: 'nav.identity', component: SiteSection },
  { id: 'social', tab: 'tab-identity', order: 1, anchor: 'social-section', labelKey: 'nav.social', component: SocialSection },
  { id: 'footer', tab: 'tab-identity', order: 2, anchor: 'footer-section', labelKey: 'nav.footer', component: FooterSection },

  // tab-config
  { id: 'config', tab: 'tab-config', order: 0, anchor: 'config-section', labelKey: 'nav.languages', component: ConfigSection },
  { id: 'contact-reply', tab: 'tab-config', order: 1, anchor: 'contact-reply-section', labelKey: 'nav.contactReply', component: ContactReplySection },

  // tab-backup
  { id: 'backup', tab: 'tab-backup', order: 0, anchor: 'backup-section', labelKey: 'nav.backup', component: BackupSection },
  { id: 'snapshots', tab: 'tab-backup', order: 1, anchor: 'snapshots-section', labelKey: 'nav.snapshots', component: SnapshotsSection },
  { id: 'export', tab: 'tab-backup', order: 2, anchor: 'export-section', labelKey: 'nav.export', component: ExportSection },

  // tab-security
  { id: 'security', tab: 'tab-security', order: 0, anchor: 'security-section', labelKey: 'nav.password', component: SecuritySection },
  { id: 'captcha', tab: 'tab-security', order: 1, anchor: 'captcha-section', labelKey: 'nav.captcha', component: CaptchaSection },
];

export function getSectionsForTab(tab: TabId): SectionDescriptor[] {
  return SECTION_REGISTRY
    .filter((s) => s.tab === tab)
    .sort((a, b) => a.order - b.order);
}

export function getSideNavForTab(tab: TabId): { labelKey: string; anchor: string }[] {
  return getSectionsForTab(tab).map((s) => ({
    labelKey: s.labelKey,
    anchor: s.anchor,
  }));
}

/** Sections masquées en mode demo (par id) */
const DEMO_HIDDEN_SECTIONS = ['contact-reply'];

export function getDemoFilteredSections(tab: TabId): SectionDescriptor[] {
  return getSectionsForTab(tab).filter((s) => !DEMO_HIDDEN_SECTIONS.includes(s.id));
}

export function getDemoFilteredSideNav(tab: TabId): { labelKey: string; anchor: string }[] {
  return getDemoFilteredSections(tab).map((s) => ({
    labelKey: s.labelKey,
    anchor: s.anchor,
  }));
}
