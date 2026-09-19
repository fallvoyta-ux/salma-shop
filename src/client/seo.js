/**
 * Gestion du titre et des métadonnées par page.
 *
 * Le site est une application monopage : sans cela, Google et les réseaux
 * sociaux voient exactement le même <title> et la même description sur
 * toutes les pages, ce qui pénalise fortement le référencement.
 */

const SITE = 'Salma Shop | Global Business Services Grp SF';
const ORIGIN = 'https://salmashop.onrender.com';

const ROUTES = {
  '/': {
    title: `${SITE} — Vente d’articles divers à Dakar`,
    description:
      'Boutique en ligne à Dakar : mode femme et homme, chaussures, sacs, montres, bijoux et tissus. Paiement Wave et Orange Money, livraison rapide au Sénégal.'
  },
  '/shop': {
    title: `Boutique en ligne — ${SITE}`,
    description:
      'Tous nos articles disponibles : vêtements, chaussures, sacs, accessoires et tissus, à tous les budgets. Livraison partout au Sénégal.'
  },
  '/categories': {
    title: `Nos catégories d’articles — ${SITE}`,
    description:
      'Parcourez nos catégories : habits femmes, hommes et enfants, chaussures, sacs, montres, lunettes, bijoux et tissus.'
  },
  '/cart': { title: `Mon panier — ${SITE}`, noindex: true },
  '/checkout': { title: `Commande — ${SITE}`, noindex: true },
  '/track-order': {
    title: `Suivre ma commande — ${SITE}`,
    description: 'Suivez l’état de votre commande Salma Shop en saisissant votre numéro de commande.'
  },
  '/login': { title: `Connexion — ${SITE}`, noindex: true },
  '/register': { title: `Créer un compte — ${SITE}`, noindex: true },
  '/account': { title: `Mon compte — ${SITE}`, noindex: true },
  '/about': {
    title: `À propos — ${SITE}`,
    description:
      'Global Business Services Grp SF (Groupe Salma Fall) : « La Qualité fait la Différence ». Notre histoire et nos engagements à Dakar.'
  },
  '/contact': {
    title: `Nous contacter — ${SITE}`,
    description:
      'Contactez Salma Shop à Dakar par téléphone, WhatsApp au +221 77 201 86 97 ou via notre formulaire.'
  },
  '/terms': { title: `Conditions générales de vente — ${SITE}` },
  '/privacy': { title: `Politique de confidentialité — ${SITE}` }
};

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, val] = selector.match(/\[(.+?)="(.+?)"\]/) || [];
    if (key && val) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function applyRouteMeta(pathname) {
  let meta = ROUTES[pathname];

  if (!meta) {
    if (pathname.startsWith('/product/')) {
      // Le titre définitif est posé par la fiche produit une fois chargée
      meta = { title: `Fiche produit — ${SITE}` };
    } else if (pathname.startsWith('/order-confirmation/')) {
      meta = { title: `Commande confirmée — ${SITE}`, noindex: true };
    } else if (pathname.startsWith('/admin')) {
      meta = { title: `Espace administrateur — ${SITE}`, noindex: true };
    } else {
      meta = { title: `Page introuvable — ${SITE}`, noindex: true };
    }
  }

  document.title = meta.title;

  if (meta.description) {
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('meta[property="og:description"]', 'content', meta.description);
  }
  setMeta('meta[property="og:title"]', 'content', meta.title);

  // Les pages privées (panier, compte, admin) ne doivent pas être indexées
  const robots = document.head.querySelector('meta[name="robots"]');
  if (meta.noindex) {
    setMeta('meta[name="robots"]', 'content', 'noindex, nofollow');
  } else if (robots) {
    robots.remove();
  }

  // URL canonique correcte page par page
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', ORIGIN + (pathname === '/' ? '/' : pathname));
  setMeta('meta[property="og:url"]', 'content', ORIGIN + (pathname === '/' ? '/' : pathname));
}
