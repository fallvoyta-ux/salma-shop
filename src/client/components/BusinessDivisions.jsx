import React from 'react';

export default function BusinessDivisions({ onSelectDivision, onNavigate }) {
  const handleGlobalBusinessClick = () => {
    if (onSelectDivision) {
      onSelectDivision('femme');
    }
    const el = document.getElementById('articles-list');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSalmaKidsClick = () => {
    if (onSelectDivision) {
      onSelectDivision('enfant');
    }
    const el = document.getElementById('articles-list');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="business-divisions-section" aria-label="Nos Rayons Spécialisés">
      <div className="divisions-grid">
        {/* DIVISION 1 : GLOBAL BUSINESS */}
        <div className="division-card division-global-business" onClick={handleGlobalBusinessClick}>
          <div className="division-card-glow"></div>
          <div className="division-badge">
            <span className="division-badge-icon">👩🧕 🏡</span>
            <span className="division-badge-text">Rayon Femmes & Maison</span>
          </div>

          <div className="division-header">
            <h3 className="division-title">
              Global Business
            </h3>
            <span className="division-tagline">Vente Articles Divers</span>
          </div>

          <p className="division-description">
            Tous genres d'accessoires de Femmes 👩🧕 et Accessoires pour la maison 🏡
          </p>

          <div className="division-features">
            <span className="feature-pill">👗 Mode & Robes</span>
            <span className="feature-pill">👜 Sacs & Bijoux</span>
            <span className="feature-pill">🏡 Déco & Maison</span>
            <span className="feature-pill">🧵 Tissus Wax</span>
          </div>

          <div className="division-footer">
            <button
              type="button"
              className="division-action-btn btn-gb"
              onClick={(e) => {
                e.stopPropagation();
                handleGlobalBusinessClick();
              }}
            >
              <span>Découvrir le Rayon Femmes & Maison</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>

        {/* DIVISION 2 : SALMA KIDS */}
        <div className="division-card division-salma-kids" onClick={handleSalmaKidsClick}>
          <div className="division-card-glow"></div>
          <div className="division-badge kids-badge">
            <span className="division-badge-icon">👦👶🧒👧</span>
            <span className="division-badge-text">Univers Enfants & Bébés</span>
          </div>

          <div className="division-header">
            <h3 className="division-title kids-title">
              SALMA KIDS
            </h3>
            <span className="division-tagline kids-tagline">Éveil, Jeux & Accessoires</span>
          </div>

          <p className="division-description">
            Vente Jouets éducatifs et accessoires pour enfants 👦👶🧒👧
          </p>

          <div className="division-features">
            <span className="feature-pill kids-pill">🧸 Jouets Éducatifs</span>
            <span className="feature-pill kids-pill">🍼 Gourdes & Repas</span>
            <span className="feature-pill kids-pill">🎒 Cartables & Sacs</span>
            <span className="feature-pill kids-pill">👟 Chaussures Enfants</span>
          </div>

          <div className="division-footer">
            <button
              type="button"
              className="division-action-btn btn-sk"
              onClick={(e) => {
                e.stopPropagation();
                handleSalmaKidsClick();
              }}
            >
              <span>Explorer l'Univers SALMA KIDS</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
