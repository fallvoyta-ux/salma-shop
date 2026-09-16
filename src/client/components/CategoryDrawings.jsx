import React from 'react';

/**
 * Dessins d'articles en pur contour (Line Art / Outline) sans couleurs
 * Style minimalist épuré : stroke="currentColor", fill="none"
 */

export function CartDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Poignée et panier caddie */}
      <path d="M14 20 L23 20 L31 52 L57 52 L65 27 L25 27" />
      {/* Grillage du panier */}
      <line x1="27" y1="35" x2="62" y2="35" />
      <line x1="29" y1="43" x2="59" y2="43" />
      <line x1="36" y1="27" x2="34" y2="52" />
      <line x1="46" y1="27" x2="44" y2="52" />
      <line x1="56" y1="27" x2="54" y2="52" />
      {/* Roues */}
      <circle cx="33" cy="62" r="4.5" />
      <circle cx="55" cy="62" r="4.5" />
    </svg>
  );
}

export function DressDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Cintre */}
      <path d="M40 14 C38 14 36 15.5 36 17.5 C36 19.5 38 20.5 40 21 L28 26 L52 26 L40 21" />
      {/* Buste robe */}
      <path d="M30 26 L34 40 L46 40 L50 26" />
      {/* Jupe évasée */}
      <path d="M34 40 L20 67 L60 67 L46 40" />
      {/* Ceinture et plis */}
      <line x1="34" y1="40" x2="46" y2="40" />
      <path d="M33 46 C34 54 30 62 29 67" />
      <path d="M47 46 C46 54 50 62 51 67" />
    </svg>
  );
}

export function ShirtDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Corps chemise et manches */}
      <path d="M26 26 L15 33 L20 42 L26 38 L26 66 L54 66 L54 38 L60 42 L65 33 L54 26" />
      {/* Col */}
      <path d="M26 26 L36 30 L32 18 L40 22 L48 18 L44 30 L54 26" />
      {/* Boutonnage et boutons */}
      <line x1="40" y1="22" x2="40" y2="66" />
      <circle cx="40" cy="36" r="1.6" fill="currentColor" />
      <circle cx="40" cy="46" r="1.6" fill="currentColor" />
      <circle cx="40" cy="56" r="1.6" fill="currentColor" />
      {/* Poche poitrine */}
      <path d="M46 37 L51 37 L51 44 L46 44 Z" />
    </svg>
  );
}

export function KidDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* T-shirt col et manches */}
      <path d="M33 22 C35 25 45 25 47 22" />
      <path d="M25 24 L17 31 L23 37 L27 32" />
      <path d="M55 24 L63 31 L57 37 L53 32" />
      {/* Bretelles avec boutons */}
      <line x1="30" y1="24" x2="30" y2="36" />
      <line x1="50" y1="24" x2="50" y2="36" />
      <circle cx="30" cy="35" r="1.6" fill="currentColor" />
      <circle cx="50" cy="35" r="1.6" fill="currentColor" />
      {/* Plastron et pantalon salopette */}
      <path d="M27 36 L53 36 L53 46 L27 46 Z" />
      <path d="M27 46 L25 65 L37 65 L40 53 L43 65 L55 65 L53 46" />
      {/* Petite poche */}
      <path d="M36 39 L44 39 C44 43 36 43 36 39 Z" />
    </svg>
  );
}

export function BagDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Anse courbée */}
      <path d="M28 35 C28 18 52 18 52 35" />
      {/* Corps du sac */}
      <path d="M21 35 L59 35 L55 66 L25 66 Z" />
      {/* Rabat */}
      <path d="M21 35 L59 35 L56 48 L44 54 C42 55 38 55 36 54 L24 48 Z" />
      {/* Fermoir */}
      <rect x="37" y="50" width="6" height="5" rx="1" />
      {/* Pieds */}
      <line x1="28" y1="66" x2="28" y2="69" />
      <line x1="52" y1="66" x2="52" y2="69" />
    </svg>
  );
}

export function ShoeDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Silhouette basket */}
      <path d="M17 38 C18 33 23 31 26 33 L32 37 C36 38 41 34 45 29 L50 35 C54 39 60 44 67 49 C70 52 71 56 69 58 L15 58 C13 54 13 44 17 38 Z" />
      {/* Semelle */}
      <path d="M12 58 L72 58 C74 58 74 61 72 63 L69 66 C68 67 66 67 64 67 L16 67 C13 67 11 65 11 62 Z" />
      <line x1="12" y1="62" x2="72" y2="62" />
      {/* Lacets */}
      <line x1="38" y1="38" x2="45" y2="42" />
      <line x1="43" y1="34" x2="50" y2="38" />
      <line x1="48" y1="31" x2="55" y2="35" />
    </svg>
  );
}

export function BottleDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Bouchon et poignée */}
      <path d="M47 17 C54 17 57 23 55 29" />
      <rect x="35" y="12" width="10" height="8" rx="2" />
      <line x1="33" y1="20" x2="47" y2="20" />
      {/* Goulot et corps */}
      <path d="M34 24 L46 24 L48 29 L32 29 Z" />
      <rect x="29" y="29" width="22" height="37" rx="6" />
      {/* Lignes graduation */}
      <line x1="35" y1="38" x2="45" y2="38" strokeDasharray="2 3" />
      <line x1="35" y1="46" x2="45" y2="46" strokeDasharray="2 3" />
      <line x1="35" y1="54" x2="45" y2="54" strokeDasharray="2 3" />
    </svg>
  );
}

export function GlassesDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Branches */}
      <path d="M16 35 C14 26 18 21 24 20" />
      <path d="M64 35 C66 26 62 21 56 20" />
      {/* Barre supérieure et pont */}
      <line x1="15" y1="36" x2="65" y2="36" />
      <path d="M37 38 C37 34 43 34 43 38" />
      {/* Verre gauche */}
      <path d="M16 37 C16 37 25 37 36 37 C36 49 33 56 26 57 C19 58 16 50 16 37 Z" />
      {/* Verre droit */}
      <path d="M44 37 C55 37 64 37 64 37 C64 50 61 58 54 57 C47 56 44 49 44 37 Z" />
    </svg>
  );
}

export function FabricDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* 3 Rouleaux empilés */}
      <rect x="15" y="52" width="50" height="15" rx="5" />
      <ellipse cx="65" cy="59.5" rx="3.5" ry="7.5" />
      <rect x="18" y="38" width="46" height="15" rx="5" />
      <ellipse cx="64" cy="45.5" rx="3.5" ry="7.5" />
      <rect x="22" y="24" width="42" height="15" rx="5" />
      <ellipse cx="64" cy="31.5" rx="3.5" ry="7.5" />
      {/* Ruban */}
      <line x1="38" y1="24" x2="38" y2="67" />
      <circle cx="38" cy="24" r="2.5" />
    </svg>
  );
}

export function WatchDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Bracelet */}
      <rect x="33" y="11" width="14" height="15" rx="2" />
      <line x1="33" y1="18" x2="47" y2="18" />
      <rect x="33" y="54" width="14" height="15" rx="2" />
      <line x1="33" y1="61" x2="47" y2="61" />
      {/* Boîtier et cadran */}
      <circle cx="40" cy="40" r="18" />
      <circle cx="40" cy="40" r="14" />
      {/* Couronne */}
      <rect x="58" y="38" width="3.5" height="4" rx="1" />
      {/* Aiguilles */}
      <line x1="40" y1="40" x2="34" y2="34" />
      <line x1="40" y1="40" x2="48" y2="32" />
      <circle cx="40" cy="40" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function JewelryDrawing({ size = 42 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto' }}>
      {/* Chaîne */}
      <path d="M22 18 C28 42 52 42 58 18" strokeDasharray="3 2" />
      {/* Pendentif */}
      <circle cx="40" cy="34" r="2.5" />
      <polygon points="40,36 47,44 40,54 33,44" />
      <line x1="33" y1="44" x2="47" y2="44" />
      {/* Créoles */}
      <circle cx="21" cy="27" r="1.5" fill="currentColor" />
      <line x1="21" y1="28.5" x2="21" y2="33" />
      <circle cx="21" cy="40" r="6.5" />
      <circle cx="59" cy="27" r="1.5" fill="currentColor" />
      <line x1="59" y1="28.5" x2="59" y2="33" />
      <circle cx="59" cy="40" r="6.5" />
    </svg>
  );
}

/**
 * Mapping des rayons en mode contour pur (Line Art)
 */
export const CATEGORY_THEMES = {
  '': {
    slug: '',
    name: 'Tous les articles',
    svgUrl: '/categories/cat_all.svg',
    bgColor: '#ffffff',
    Component: CartDrawing
  },
  'habits-femmes': {
    slug: 'habits-femmes',
    name: 'Habits Femmes',
    svgUrl: '/categories/cat_habits_femmes.svg',
    bgColor: '#ffffff',
    Component: DressDrawing
  },
  'habits-hommes': {
    slug: 'habits-hommes',
    name: 'Habits Hommes',
    svgUrl: '/categories/cat_habits_hommes.svg',
    bgColor: '#ffffff',
    Component: ShirtDrawing
  },
  'habits-enfants': {
    slug: 'habits-enfants',
    name: 'Habits Enfants',
    svgUrl: '/categories/cat_habits_enfants.svg',
    bgColor: '#ffffff',
    Component: KidDrawing
  },
  'sacs-femmes-enfants': {
    slug: 'sacs-femmes-enfants',
    name: 'Sacs Femmes & Enfants',
    svgUrl: '/categories/cat_sacs.svg',
    bgColor: '#ffffff',
    Component: BagDrawing
  },
  'chaussures-enfants-adultes': {
    slug: 'chaussures-enfants-adultes',
    name: 'Chaussures Enfants & Adultes',
    svgUrl: '/categories/cat_chaussures.svg',
    bgColor: '#ffffff',
    Component: ShoeDrawing
  },
  'bouteilles-eau-enfants': {
    slug: 'bouteilles-eau-enfants',
    name: 'Bouteilles d’Eau & Gourdes Enfants',
    svgUrl: '/categories/cat_bouteilles.svg',
    bgColor: '#ffffff',
    Component: BottleDrawing
  },
  'lunettes': {
    slug: 'lunettes',
    name: 'Lunettes de Soleil & Tendance',
    svgUrl: '/categories/cat_lunettes.svg',
    bgColor: '#ffffff',
    Component: GlassesDrawing
  },
  'tissus': {
    slug: 'tissus',
    name: 'Tissus & Pagnes de Qualité',
    svgUrl: '/categories/cat_tissus.svg',
    bgColor: '#ffffff',
    Component: FabricDrawing
  },
  'montres': {
    slug: 'montres',
    name: 'Montres Hommes & Femmes',
    svgUrl: '/categories/cat_montres.svg',
    bgColor: '#ffffff',
    Component: WatchDrawing
  },
  'boucles-oreilles-chaines': {
    slug: 'boucles-oreilles-chaines',
    name: 'Boucles d’Oreilles & Chaînes',
    svgUrl: '/categories/cat_bijoux.svg',
    bgColor: '#ffffff',
    Component: JewelryDrawing
  }
};

export function getCategoryTheme(slug = '') {
  if (!slug) return CATEGORY_THEMES[''];
  if (CATEGORY_THEMES[slug]) return CATEGORY_THEMES[slug];

  const s = slug.toLowerCase();
  if (s.includes('femme')) return CATEGORY_THEMES['habits-femmes'];
  if (s.includes('homme')) return CATEGORY_THEMES['habits-hommes'];
  if (s.includes('enfant')) return CATEGORY_THEMES['habits-enfants'];
  if (s.includes('sac')) return CATEGORY_THEMES['sacs-femmes-enfants'];
  if (s.includes('chaussure')) return CATEGORY_THEMES['chaussures-enfants-adultes'];
  if (s.includes('bouteille') || s.includes('gourde')) return CATEGORY_THEMES['bouteilles-eau-enfants'];
  if (s.includes('lunette')) return CATEGORY_THEMES['lunettes'];
  if (s.includes('tissu') || s.includes('wax')) return CATEGORY_THEMES['tissus'];
  if (s.includes('montre')) return CATEGORY_THEMES['montres'];
  if (s.includes('boucle') || s.includes('chaine') || s.includes('bijou')) return CATEGORY_THEMES['boucles-oreilles-chaines'];

  return CATEGORY_THEMES[''];
}

export default function CategoryDrawing({ slug = '', alt = '', size = 42 }) {
  const theme = getCategoryTheme(slug);
  const Component = theme.Component || CartDrawing;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.25s ease'
      }}
      title={alt || theme.name}
    >
      <Component size={size} />
    </div>
  );
}
