// Server Component — port de _old/views/sections/services.ejs
export function ServicesSection() {
  return (
    <section className="section section-services" id="services">
      <div className="container">
        <h2 className="section-title" data-content-key="services-title">
          Nos Services
        </h2>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">&#127968;</div>
            <h3 data-content-key="service-1-title">Renovation chalet</h3>
            <p data-content-key="service-1-desc">
              Restauration complete de chalets traditionnels : ossature bois, bardage vieux bois,
              isolation haute performance.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">&#129521;</div>
            <h3 data-content-key="service-2-title">Maconnerie alpine</h3>
            <p data-content-key="service-2-desc">
              Construction en pierre de montagne, soubassements massifs, murets traditionnels,
              fondations renforcees.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">&#127912;</div>
            <h3 data-content-key="service-3-title">Habillage bois</h3>
            <p data-content-key="service-3-desc">
              Bardage meleze et epicea, lambris interieurs, planchers massifs, escaliers sur mesure
              en bois noble.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">&#128296;</div>
            <h3 data-content-key="service-4-title">Extension &amp; Toiture</h3>
            <p data-content-key="service-4-desc">
              Agrandissement harmonieux, toitures en ardoise ou tavaillons, charpentes
              traditionnelles, balcons bois.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
