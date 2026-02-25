// Server Component — port de _old/views/sections/about.ejs
export function AboutSection() {
  return (
    <section className="section section-about">
      <div className="container">
        <h2 className="section-title" data-content-key="about-title">
          Notre Expertise Alpine
        </h2>
        <div className="about-content">
          <div className="about-text">
            <p data-content-key="about-p1">
              Depuis plus de 15 ans, nous perpetuons la tradition des batisseurs savoyards avec
              passion et authenticite. Specialistes du bois massif, de la pierre alpine et de
              l&apos;ardoise naturelle, nous creons et restaurons des chalets qui incarnent
              l&apos;esprit montagnard dans toute sa noblesse.
            </p>
            <p data-content-key="about-p2">
              Notre philosophie : allier robustesse ancestrale et confort moderne pour faconner des
              espaces chaleureux qui resistent au temps et aux rigueurs de l&apos;altitude. Chaque
              projet reflete l&apos;ame des Alpes et la solidite de nos montagnes.
            </p>
          </div>
          <div className="about-features">
            <div className="feature-card">
              <div className="feature-icon">&#127942;</div>
              <h3 data-content-key="feature-1-title">15+ ans d&apos;experience</h3>
              <p data-content-key="feature-1-desc">
                Une expertise reconnue dans la construction et renovation de chalets alpins
                authentiques
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#10003;</div>
              <h3 data-content-key="feature-2-title">Materiaux nobles</h3>
              <p data-content-key="feature-2-desc">
                Bois massif local, pierre de montagne, ardoise naturelle, toitures traditionnelles
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#128188;</div>
              <h3 data-content-key="feature-3-title">Devis gratuit</h3>
              <p data-content-key="feature-3-desc">
                Estimation detaillee et sans engagement sous 48h
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
