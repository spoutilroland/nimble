// Server Component — port de _old/views/sections/about.ejs
import type { Section } from '@/lib/types';
import { ck } from '@/lib/content-key';

interface Props { section: Section; }

export function AboutSection({ section }: Props) {
  const k = (key: string) => ck(section.contentId, key);
  return (
    <section className="section section-about">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="section-title" data-content-key={k('about-title')}>
          Notre Expertise Alpine
        </h2>
        <div className="about-content grid gap-16">
          <div className="about-text text-[1.1rem] leading-8 text-[var(--text-muted)] text-center max-w-[900px] mx-auto">
            <p className="mb-6" data-content-key={k('about-p1')}>
              Depuis plus de 15 ans, nous perpetuons la tradition des batisseurs savoyards avec
              passion et authenticite. Specialistes du bois massif, de la pierre alpine et de
              l&apos;ardoise naturelle, nous creons et restaurons des chalets qui incarnent
              l&apos;esprit montagnard dans toute sa noblesse.
            </p>
            <p className="mb-6" data-content-key={k('about-p2')}>
              Notre philosophie : allier robustesse ancestrale et confort moderne pour faconner des
              espaces chaleureux qui resistent au temps et aux rigueurs de l&apos;altitude. Chaque
              projet reflete l&apos;ame des Alpes et la solidite de nos montagnes.
            </p>
          </div>
          <div className="about-features grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10">
            <div className="feature-card">
              <div className="feature-icon text-[4rem] mb-6">&#127942;</div>
              <h3 className="font-['Oswald',sans-serif] text-[var(--primary-dark)] mb-4 text-[1.4rem] font-bold uppercase tracking-[1px]" data-content-key={k('feature-1-title')}>15+ ans d&apos;experience</h3>
              <p className="text-[var(--text-muted)] leading-[1.8]" data-content-key={k('feature-1-desc')}>
                Une expertise reconnue dans la construction et renovation de chalets alpins
                authentiques
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon text-[4rem] mb-6">&#10003;</div>
              <h3 className="font-['Oswald',sans-serif] text-[var(--primary-dark)] mb-4 text-[1.4rem] font-bold uppercase tracking-[1px]" data-content-key={k('feature-2-title')}>Materiaux nobles</h3>
              <p className="text-[var(--text-muted)] leading-[1.8]" data-content-key={k('feature-2-desc')}>
                Bois massif local, pierre de montagne, ardoise naturelle, toitures traditionnelles
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon text-[4rem] mb-6">&#128188;</div>
              <h3 className="font-['Oswald',sans-serif] text-[var(--primary-dark)] mb-4 text-[1.4rem] font-bold uppercase tracking-[1px]" data-content-key={k('feature-3-title')}>Devis gratuit</h3>
              <p className="text-[var(--text-muted)] leading-[1.8]" data-content-key={k('feature-3-desc')}>
                Estimation detaillee et sans engagement sous 48h
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
