import React, { useState } from 'react';

export default function AssuranceBanner() {
  const [showModal, setShowModal] = useState(false);

  const whatsappPhone = '221772018697';
  const whatsappMsg = `Bonjour Global Business Grp SF 3S ! 🚗\n` +
    `Je souhaite obtenir un devis / souscrire une assurance (Toutes Branches).\n` +
    `Je vous transmets ci-joint les photos de ma carte grise.\n` +
    `Merci de m'indiquer la démarche et le tarif !`;

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <>
      <section className="assurance-banner-section" aria-label="Service Assurance Toutes Branches">
        <div className="assurance-banner-card">
          {/* Arrière-plan avec reflets technologiques */}
          <div className="assurance-card-glow orange"></div>
          <div className="assurance-card-glow purple"></div>

          <div className="assurance-card-grid">
            {/* Colonne Gauche : Contenu & Processus Express */}
            <div className="assurance-content">
              {/* Badge Entreprise */}
              <div className="assurance-badge">
                <span className="assurance-badge-dot"></span>
                <span className="assurance-badge-text">GLOBAL BUSINESS GRP SF 3S</span>
                <span className="assurance-badge-tag">NOUVEAU SERVICE</span>
              </div>

              {/* Titre Principal percutant */}
              <h2 className="assurance-title">
                ASSURANCE <span className="assurance-highlight">TOUTES BRANCHES</span>
              </h2>

              <p className="assurance-tagline">
                🛡️ <strong>Assistance garantie</strong> pour tous vos véhicules & démarches administratives au Sénégal.
              </p>

              {/* Badges Véhicules couverts */}
              <div className="assurance-vehicles-grid">
                <div className="assurance-vehicle-chip">
                  <span className="chip-icon">🚗</span>
                  <span className="chip-label">Voitures & SUV</span>
                </div>
                <div className="assurance-vehicle-chip">
                  <span className="chip-icon">🏍️</span>
                  <span className="chip-label">Motos & Scooters</span>
                </div>
                <div className="assurance-vehicle-chip">
                  <span className="chip-icon">🚚</span>
                  <span className="chip-label">Camions & Poids Lourds</span>
                </div>
                <div className="assurance-vehicle-chip">
                  <span className="chip-icon">🚌</span>
                  <span className="chip-label">Bus & Transport</span>
                </div>
              </div>

              {/* Encadré Processus Express */}
              <div className="assurance-process-box">
                <div className="process-header">
                  <span className="process-pulse-icon">⚡</span>
                  <span className="process-title">PROCESSUS EXPRESS PAR WHATSAPP</span>
                </div>
                <div className="process-steps">
                  <div className="process-step-item">
                    <span className="step-num">1</span>
                    <span className="step-desc">Prenez en photo votre <strong>Carte Grise</strong></span>
                  </div>
                  <div className="process-step-item">
                    <span className="step-num">2</span>
                    <span className="step-desc">Envoyez les photos sur WhatsApp au <strong>+221 77 201 86 97</strong></span>
                  </div>
                  <div className="process-step-item">
                    <span className="step-num">3</span>
                    <span className="step-desc">Recevez votre <strong>attestation & devis immédiat</strong> sans vous déplacer !</span>
                  </div>
                </div>
              </div>

              {/* Boutons d'Action Directs */}
              <div className="assurance-actions">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="assurance-btn whatsapp-btn"
                  title="Envoyer la photo de votre carte grise sur WhatsApp"
                >
                  <span className="btn-icon">💬</span>
                  <div className="btn-text-wrap">
                    <span className="btn-sub">WhatsApp Direct</span>
                    <span className="btn-main">Envoyer Carte Grise (+221 77 201 86 97)</span>
                  </div>
                </a>

                <a
                  href="tel:+221772018697"
                  className="assurance-btn call-btn"
                  title="Appeler directement notre service assurance"
                >
                  <span className="btn-icon">📞</span>
                  <div className="btn-text-wrap">
                    <span className="btn-sub">Appel Téléphonique</span>
                    <span className="btn-main">77 201 86 97</span>
                  </div>
                </a>
              </div>

              {/* Ligne d'assistance garantie */}
              <div className="assurance-footer-note">
                <span>✨ Avec une assistance garantie pour tous vos besoins • Service réactif 7j/7</span>
              </div>
            </div>

            {/* Colonne Droite : Affiche Officielle Modernisée avec Lightbox */}
            <div className="assurance-visual-col">
              <div
                className="assurance-poster-frame"
                onClick={() => setShowModal(true)}
                title="Cliquer pour afficher l'affiche officielle en grand écran"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setShowModal(true); }}
              >
                <div className="poster-overlay-badge">
                  <span>🔍 Cliquer pour agrandir</span>
                </div>
                <img
                  src="/assurance.jpg"
                  alt="Affiche Officielle Assurance Toutes Branches - Global Business Grp SF 3S"
                  className="assurance-poster-img"
                  loading="lazy"
                />
                <div className="poster-bottom-glow"></div>
              </div>

              <div className="poster-caption">
                <span className="caption-tag">Affiche Officielle</span>
                <span>Global Business Grp SF 3S • Dakar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Lightbox Affiche Grand Écran */}
      {showModal && (
        <div
          className="assurance-modal-backdrop"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="assurance-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="assurance-modal-close"
              onClick={() => setShowModal(false)}
              title="Fermer la vue agrandie"
              aria-label="Fermer"
            >
              ✕
            </button>
            <img
              src="/assurance.jpg"
              alt="Affiche Complète Assurance Toutes Branches - Global Business Grp SF 3S"
              className="assurance-modal-img"
            />
            <div className="assurance-modal-footer">
              <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                📱 Contact WhatsApp Express : <strong>+221 77 201 86 97</strong>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ background: '#25d366', borderColor: '#25d366', fontWeight: 700 }}
              >
                💬 Envoyer ma Carte Grise
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
