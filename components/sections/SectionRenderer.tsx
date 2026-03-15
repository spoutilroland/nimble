// Server Component — dispatch sur section.type
import type { Section, SiteConfig, Layout } from '@/lib/types';
import { HeroSection } from './HeroSection';
import { HeroSimpleSection } from './HeroSimpleSection';
import { AboutSection } from './AboutSection';
import { ServicesSection } from './ServicesSection';
import { GallerySection } from './GallerySection';
import { ContactSection } from './ContactSection';
import { BentoGridSection } from './BentoGridSection';
import { CinematicSplitSection } from './CinematicSplitSection';
import { PolaroidsSection } from './PolaroidsSection';
import { StatsSection } from './StatsSection';
import { CustomLayoutSection } from './CustomLayoutSection';

interface Props {
  section: Section;
  site: SiteConfig;
  layouts: Record<string, Layout>;
}

export function SectionRenderer({ section, site, layouts }: Props) {
  switch (section.type) {
    case 'hero':
      return <HeroSection section={section} />;
    case 'hero-simple':
      return <HeroSimpleSection section={section} />;
    case 'about':
      return <AboutSection section={section} />;
    case 'services':
      return <ServicesSection section={section} />;
    case 'gallery':
      return <GallerySection section={section} />;
    case 'contact':
      return (
        <ContactSection
          captchaProvider={site.captcha?.provider || undefined}
          captchaSiteKey={site.captcha?.siteKey || undefined}
        />
      );
    case 'bento-grid':
      return <BentoGridSection section={section} />;
    case 'cinematic-split':
      return <CinematicSplitSection section={section} />;
    case 'polaroids':
      return <PolaroidsSection section={section} />;
    case 'stats':
      return <StatsSection section={section} />;
    case 'custom-layout': {
      const layout = section.layoutId ? layouts[section.layoutId] : undefined;
      if (!layout) return null;
      return <CustomLayoutSection section={section} layout={layout} />;
    }
    default:
      return null;
  }
}
