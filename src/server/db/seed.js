import bcrypt from 'bcryptjs';
import { db } from './connection.js';

export async function seedDatabase() {
  console.log('🌱 Initialisation et peuplement complet de la base Salma Shop (Rose du Logo & Articles Divers)...');

  // 1. Paramètres de la boutique
  const settingsData = [
    { key: 'store_name', value: 'Global Business Services Grp SF', description: 'Nom officiel de la boutique' },
    { key: 'store_subtitle', value: 'Groupe Salma Fall - Vente Articles Divers', description: 'Sous-titre de la marque' },
    { key: 'store_slogan', value: '« La Qualité fait la Différence 💜🕊️🌹 »', description: 'Slogans officiels' },
    { key: 'store_phone', value: '+221 77 201 86 97', description: 'Téléphone officiel WhatsApp Dakar' },
    { key: 'store_phone_alt1', value: '+221 76 251 11 12', description: 'Téléphone Mobile direct' },
    { key: 'store_whatsapp', value: '221772018697', description: 'Numéro WhatsApp pour commandes directes' },
    { key: 'store_email', value: 'contact@salmashop.sn', description: 'Email de contact' },
    { key: 'store_address', value: 'Dakar, Sénégal', description: 'Adresse de la boutique' },
    { key: 'currency', value: 'FCFA', description: 'Devise monétaire principale' },
    { key: 'announcement_bar', value: '✨ Global Business Services Grp SF • Groupe Salma Fall • « La Qualité fait la Différence 💜🕊️🌹 » • WhatsApp : +221 77 201 86 97 • 76 251 11 12', description: 'Bannière promotionnelle haute' },
    { key: 'announcement_active', value: 'true', description: 'Afficher la bannière promotionnelle (true/false)' },
    { key: 'whatsapp_ordering_enabled', value: 'true', description: 'Activer le bouton Commander via WhatsApp (true/false)' },
    { key: 'free_shipping_threshold', value: '40000', description: 'Seuil de gratuité de la livraison en FCFA' },
    { key: 'store_logo', value: '/logo.jpg', description: 'Chemin du logo officiel' }
  ];

  for (const s of settingsData) {
    await db.execute(`
      INSERT INTO settings (key, value, description, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, description = excluded.description, updated_at = CURRENT_TIMESTAMP
    `, [s.key, s.value, s.description]);
  }

  // 2. Zones de livraison
  const zonesData = [
    { name: 'Dakar Centre (Plateau, Médina, Fann, Point E)', price: 1500, estimated_days: 'Livraison le jour même' },
    { name: 'Dakar Ouest & Nord (Almadies, Ngor, Ouakam, Mermoz, Yoff)', price: 2000, estimated_days: 'Livraison en 24h' },
    { name: 'Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque)', price: 2500, estimated_days: 'Livraison en 24h à 48h' },
    { name: 'Thiès, Mbour, Saly Portudal', price: 3500, estimated_days: 'Livraison en 48h' },
    { name: 'Autres Régions (Saint-Louis, Touba, Kaolack, Ziguinchor)', price: 5000, estimated_days: 'Expédition sous 3 à 4 jours' },
    { name: 'Retrait Gratuit en Boutique (Dakar)', price: 0, estimated_days: 'Disponible en 2h après confirmation' }
  ];

  const existingZones = await db.queryAll('SELECT COUNT(*) as count FROM delivery_zones');
  const countZones = existingZones && existingZones[0] ? Number(existingZones[0].count) : 0;
  if (countZones === 0) {
    for (const z of zonesData) {
      await db.execute('INSERT INTO delivery_zones (name, price, estimated_days) VALUES (?, ?, ?)', [z.name, z.price, z.estimated_days]);
    }
  }

  // 3. Utilisateurs
  const adminSalmaPasswordHash = await bcrypt.hash('AdminSalma2026!', 10);
  const clientSalmaPasswordHash = await bcrypt.hash('ClientSalma123!', 10);

  const usersToInsert = [
    { fn: 'Salma', ln: 'Propriétaire', em: 'admin@salmashop.sn', ph: '+221 77 201 86 97', pw: adminSalmaPasswordHash, role: 'admin', ad: 'Dakar' },
    { fn: 'Fatou', ln: 'Diop', em: 'client@salmashop.sn', ph: '+221 78 987 65 43', pw: clientSalmaPasswordHash, role: 'client', ad: 'Almadies' },
    { fn: 'Salma', ln: 'Admin', em: 'admin@terangashop.sn', ph: '+221 77 201 86 97', pw: adminSalmaPasswordHash, role: 'admin', ad: 'Dakar' }
  ];

  for (const u of usersToInsert) {
    await db.execute(`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role, address, city, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Dakar', 'Dakar')
      ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role, phone = excluded.phone
    `, [u.fn, u.ln, u.em, u.ph, u.pw, u.role, u.ad]);
  }

  // 4. Catégories Complètes Demandées par l'Utilisatrice (Dessins d'articles façon Carrefour)
  const categoriesData = [
    {
      name: 'Habits Femmes',
      slug: 'habits-femmes',
      description: 'Robes chic, tenues de soirée, tailleurs et ensembles féminins à tous les budgets.',
      image_url: '/categories/cat_habits_femmes.svg',
      display_order: 1
    },
    {
      name: 'Habits Hommes',
      slug: 'habits-hommes',
      description: 'Chemises élégantes, ensembles décontractés, polos et tenues tendance pour hommes.',
      image_url: '/categories/cat_habits_hommes.svg',
      display_order: 2
    },
    {
      name: 'Habits Enfants',
      slug: 'habits-enfants',
      description: 'Vêtements adorables et confortables pour petites filles et petits garçons.',
      image_url: '/categories/cat_habits_enfants.svg',
      display_order: 3
    },
    {
      name: 'Sacs Femmes & Enfants',
      slug: 'sacs-femmes-enfants',
      description: 'Sacs à main femme raffinés, pochettes, cartables scolaires et sacs à dos enfants.',
      image_url: '/categories/cat_sacs.svg',
      display_order: 4
    },
    {
      name: 'Chaussures Enfants & Adultes',
      slug: 'chaussures-enfants-adultes',
      description: 'Sandales glamour, talons, mocassins homme et baskets confortables enfants.',
      image_url: '/categories/cat_chaussures.svg',
      display_order: 5
    },
    {
      name: 'Bouteilles d’Eau & Gourdes Enfants',
      slug: 'bouteilles-eau-enfants',
      description: 'Gourdes étanches, bouteilles isothermes colorées et sans BPA pour l’école et les sorties.',
      image_url: '/categories/cat_bouteilles.svg',
      display_order: 6
    },
    {
      name: 'Lunettes de Soleil & Tendance',
      slug: 'lunettes',
      description: 'Lunettes de soleil UV400 chic pour femmes, hommes et enfants.',
      image_url: '/categories/cat_lunettes.svg',
      display_order: 7
    },
    {
      name: 'Tissus & Pagnes de Qualité',
      slug: 'tissus',
      description: 'Tissus Wax véritable, Bazin riche, voiles et soies pour vos confections à Dakar.',
      image_url: '/categories/cat_tissus.svg',
      display_order: 8
    },
    {
      name: 'Montres Hommes & Femmes',
      slug: 'montres',
      description: 'Montres élégantes en acier inoxydable, bracelets dorés et cadrans modernes.',
      image_url: '/categories/cat_montres.svg',
      display_order: 9
    },
    {
      name: 'Boucles d’Oreilles & Chaînes',
      slug: 'boucles-oreilles-chaines',
      description: 'Créoles, boucles pendantes dorées, chaînes et colliers plaqués or étincelants.',
      image_url: '/categories/cat_bijoux.svg',
      display_order: 10
    }
  ];

  // Réinitialiser les catégories et produits pour garantir la cohérence
  await db.execute('DELETE FROM product_images');
  await db.execute('DELETE FROM order_items');
  await db.execute('DELETE FROM reviews');
  await db.execute('DELETE FROM products');
  await db.execute('DELETE FROM categories');

  const categoryMap = {};
  for (const c of categoriesData) {
    const res = await db.execute(`
      INSERT INTO categories (name, slug, description, image_url, display_order)
      VALUES (?, ?, ?, ?, ?)
    `, [c.name, c.slug, c.description, c.image_url, c.display_order]);
    categoryMap[c.slug] = res.lastInsertRowid;
  }

  // 5. Produits Couvrant TOUS les Articles de l'Utilisatrice
  const productsData = [
    // --- 1. HABITS FEMMES ---
    {
      category_id: categoryMap['habits-femmes'],
      name: 'Robe Glamour Sirène Rose Corail - Salma Chic',
      slug: 'robe-glamour-sirene-rose-corail',
      short_description: 'Robe sirène épousant délicatement la silhouette, couleur identique au logo officiel.',
      description: 'La pièce emblématique Salma Shop Chic Ladies ! Coupe sirène élégante avec tissu extensible doux et dos nu raffiné. Parfaite pour soirées, mariages et cocktails à Dakar. « S’habiller selon son Budget 🌹 »',
      price: 26000,
      compare_price: 32000,
      stock: 15,
      low_stock_threshold: 4,
      sku: 'SLM-ROB-CORAIL',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Matière': 'Crêpe stretch premium', 'Coupe': 'Sirène avec fente latérale', 'Tailles': 'S, M, L, XL', 'Couleur': 'Rose Corail Logo' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80', is_primary: 1 },
        { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80', is_primary: 0 }
      ]
    },
    {
      category_id: categoryMap['habits-femmes'],
      name: 'Robe Longue Wax Ébène & Or',
      slug: 'robe-longue-wax-ebene-or',
      short_description: 'Sublime robe longue en véritable Wax hollandais avec motifs géométriques dorés.',
      description: 'Robe d’apparat conçue dans un coton Wax 100% de qualité supérieure. Idéale pour les grandes occasions et les cérémonies à Dakar.',
      price: 35000,
      compare_price: 45000,
      stock: 12,
      low_stock_threshold: 3,
      sku: 'ROB-WAX-001',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Matière': 'Coton Wax 100%', 'Entretien': 'Lavage doux 30°C', 'Tailles': 'M, L, XL' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 2. HABITS HOMMES ---
    {
      category_id: categoryMap['habits-hommes'],
      name: 'Chemise en Lin Blanc Cassé pour Homme',
      slug: 'chemise-lin-blanc-casse-homme',
      short_description: 'Chemise respirante col mao à manches longues en pur lin.',
      description: 'Indispensable du dressing masculin sous le climat dakarois. Coupe moderne épurée, boutons en nacre et tissu respirant ultra-confortable.',
      price: 18000,
      compare_price: 22000,
      stock: 20,
      low_stock_threshold: 5,
      sku: 'SLM-HOM-LIN01',
      is_featured: 1,
      is_promo: 0,
      specifications: JSON.stringify({ 'Matière': '100% Lin lavé', 'Col': 'Mao', 'Tailles': 'M, L, XL, XXL' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 3. HABITS ENFANTS ---
    {
      category_id: categoryMap['habits-enfants'],
      name: 'Ensemble Cérémonie Fille Robe Tulle Rose & Doré',
      slug: 'ensemble-ceremonie-fille-tulle-rose',
      short_description: 'Mignonne petite robe de fête doublée coton pour fillette.',
      description: 'Une petite merveille pour les fêtes de famille et baptêmes. Tulle vaporeux rose, petits nœuds satinés et doublure 100% coton doux qui ne pique pas.',
      price: 12500,
      compare_price: 15000,
      stock: 18,
      low_stock_threshold: 4,
      sku: 'SLM-ENF-ROB01',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Âges': '2 à 10 ans', 'Matière': 'Tulle et doublure coton doux' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 4. SACS FEMMES & ENFANTS ---
    {
      category_id: categoryMap['sacs-femmes-enfants'],
      name: 'Sac à Main Cuir Chic Ladies Rose Poudré',
      slug: 'sac-main-cuir-chic-ladies-rose-poudre',
      short_description: 'Sac cabas structuré avec finitions métallisées dorées et bandoulière amovible.',
      description: 'L’accessoire parfait au quotidien et pour vos sorties chic. Cuir synthétique haute qualité imperméable, compartiments zippés multiples.',
      price: 18500,
      compare_price: 24000,
      stock: 14,
      low_stock_threshold: 3,
      sku: 'SLM-SAC-FEM01',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Matière': 'Simili-cuir grainé', 'Dimensions': '30 x 22 x 12 cm', 'Fermeture': 'Zip doré' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },
    {
      category_id: categoryMap['sacs-femmes-enfants'],
      name: 'Sac à Dos Cartable Enfant Animaux Mignons',
      slug: 'sac-dos-cartable-enfant-animaux',
      short_description: 'Cartable léger, bretelles molletonnées ergonomiques pour l’école.',
      description: 'Idéal pour la maternelle et le primaire. Motifs joyeux, coutures renforcées et poches latérales pour la bouteille d’eau.',
      price: 8500,
      compare_price: 11000,
      stock: 25,
      low_stock_threshold: 5,
      sku: 'SLM-SAC-ENF02',
      is_featured: 0,
      is_promo: 1,
      specifications: JSON.stringify({ 'Capacité': '15 Litres', 'Poids': '350g', 'Imperméable': 'Oui' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 5. CHAUSSURES ENFANTS & ADULTES ---
    {
      category_id: categoryMap['chaussures-enfants-adultes'],
      name: 'Sandales à Talons Aiguilles Chic Ladies Dorées',
      slug: 'sandales-talons-aiguilles-chic-ladies-dorees',
      short_description: 'Sandales fines à lanières croisées et semelle matelassée grand confort.',
      description: '« S’habiller selon son Budget 🌹 » : un look glamour à prix tout doux. Talon stable de 8 cm pensé pour marcher sans fatigue.',
      price: 16500,
      compare_price: 20000,
      stock: 20,
      low_stock_threshold: 5,
      sku: 'SLM-CHA-005',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Pointures': '37 au 41', 'Talon': '8 cm', 'Couleur': 'Or métallisé' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },
    {
      category_id: categoryMap['chaussures-enfants-adultes'],
      name: 'Baskets Lumineuses Enfant Scratch Confort',
      slug: 'baskets-lumineuses-enfant-scratch',
      short_description: 'Chaussures de sport légères faciles à enfiler pour enfants.',
      description: 'Semelle antidérapante souple, fermeture scratch pratique pour les petites mains.',
      price: 9500,
      compare_price: 12000,
      stock: 22,
      low_stock_threshold: 5,
      sku: 'SLM-CHA-ENF01',
      is_featured: 0,
      is_promo: 1,
      specifications: JSON.stringify({ 'Pointures': '24 au 34', 'Semelle': 'Coussin d’air EVA', 'Fermeture': 'Double scratch' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 6. BOUTEILLES D'EAU POUR ENFANTS ---
    {
      category_id: categoryMap['bouteilles-eau-enfants'],
      name: 'Gourde Isotherme Enfant Antifuite Inox 500ml',
      slug: 'gourde-isotherme-enfant-antifuite-500ml',
      short_description: 'Bouteille d’eau réutilisable sans BPA garde l’eau fraîche pendant 12h à Dakar.',
      description: 'Parfaite pour l’école ou les sorties au parc à Dakar. Bouchon paille rabattable antifuite, poignée de transport ergonomique et motifs colorés au choix.',
      price: 4500,
      compare_price: 6000,
      stock: 35,
      low_stock_threshold: 8,
      sku: 'SLM-BOU-ENF01',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Contenance': '500 ml', 'Matière': 'Inox 304 sans BPA', 'Isolation': 'Double paroi isotherme 12h' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 7. LUNETTES DE SOLEIL ---
    {
      category_id: categoryMap['lunettes'],
      name: 'Lunettes de Soleil Cat-Eye Chic Ladies UV400',
      slug: 'lunettes-soleil-cat-eye-chic-ladies',
      short_description: 'Monture œil-de-chat rétro glam avec verres polarisés haute protection.',
      description: 'Protégez vos yeux du soleil ardent de Dakar avec une élégance hollywoodienne. Monture légère et robuste, protection solaire UV400 certifiée.',
      price: 8500,
      compare_price: 12000,
      stock: 28,
      low_stock_threshold: 6,
      sku: 'SLM-LUN-001',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Protection': 'UV400 catégorie 3', 'Monture': 'Acétate premium', 'Étui': 'Pochette microfibre offerte' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 8. TISSUS ---
    {
      category_id: categoryMap['tissus'],
      name: 'Pièce de Tissu Wax Hollandais Véritable (6 Yards)',
      slug: 'piece-tissu-wax-hollandais-6-yards',
      short_description: 'Pagne Wax 100% pur coton aux couleurs vibrantes et tenaces au lavage.',
      description: 'Le joyau de la couture sénégalaise pour coudre vos magnifiques boubous, robes et tailleurs. 6 yards (environ 5,48 mètres) de tissu éclatant.',
      price: 19500,
      compare_price: 25000,
      stock: 16,
      low_stock_threshold: 4,
      sku: 'SLM-TIS-WAX01',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Longueur': '6 Yards (5,48 m)', 'Composition': '100% Coton peigné', 'Teinture': 'Grand teint' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 9. MONTRES ---
    {
      category_id: categoryMap['montres'],
      name: 'Montre Élégante Salma Cadran Nacre & Maille Dorée',
      slug: 'montre-elegante-salma-cadran-nacre-or',
      short_description: 'Montre à quartz étanche en acier inoxydable plaqué or avec cristaux.',
      description: 'L’accessoire qui habille votre poignet avec délicatesse. Mouvement japonais haute précision, cadran en nacre irisée et fermoir aimanté ajustable.',
      price: 16500,
      compare_price: 21000,
      stock: 18,
      low_stock_threshold: 4,
      sku: 'SLM-MON-001',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Boîtier': 'Acier inoxydable plaqué or', 'Mouvement': 'Quartz haute précision', 'Étanchéité': '3 ATM' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },

    // --- 10. BOUCLES D'OREILLES & CHAÎNES ---
    {
      category_id: categoryMap['boucles-oreilles-chaines'],
      name: 'Boucles d’Oreilles Créoles Torsadées Dorées',
      slug: 'boucles-oreilles-creoles-torsadees-dorees',
      short_description: 'Créoles légères et lumineuses en acier inoxydable doré inoxydable.',
      description: 'Ne noircissent pas au contact de l’eau ou du parfum. Le bijou intemporel pour illuminer votre visage à tout moment.',
      price: 5500,
      compare_price: 7500,
      stock: 40,
      low_stock_threshold: 10,
      sku: 'SLM-BOU-001',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Matière': 'Acier inoxydable 316L plaqué or', 'Diamètre': '40 mm', 'Hypoallergénique': 'Oui' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    },
    {
      category_id: categoryMap['boucles-oreilles-chaines'],
      name: 'Chaîne Maille Serpent & Pendentif Cœur Émeraude',
      slug: 'chaine-maille-serpent-pendentif-coeur-emeraude',
      short_description: 'Collier ras-du-cou éclatant plaqué or avec cristal étincelant.',
      description: '« Se vêtir à tous prix 💜 » : une chaîne délicate et robuste qui apporte une touche royale à toutes vos tenues.',
      price: 8000,
      compare_price: 11000,
      stock: 35,
      low_stock_threshold: 8,
      sku: 'SLM-CHA-002',
      is_featured: 1,
      is_promo: 1,
      specifications: JSON.stringify({ 'Longueur': '45 cm + 5 cm ajustable', 'Plaquage': 'Or 18K résistant à l’eau' }),
      images: [
        { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80', is_primary: 1 }
      ]
    }
  ];

  for (const p of productsData) {
    const info = await db.execute(`
      INSERT INTO products (
        category_id, name, slug, short_description, description,
        price, compare_price, stock, low_stock_threshold, sku,
        is_featured, is_promo, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      p.category_id,
      p.name,
      p.slug,
      p.short_description,
      p.description,
      p.price,
      p.compare_price,
      p.stock,
      p.low_stock_threshold,
      p.sku,
      p.is_featured,
      p.is_promo,
      p.specifications
    ]);
    const prodId = info.lastInsertRowid;

    for (let idx = 0; idx < p.images.length; idx++) {
      const img = p.images[idx];
      await db.execute(`
        INSERT INTO product_images (product_id, image_url, is_primary, display_order)
        VALUES (?, ?, ?, ?)
      `, [prodId, img.url, img.is_primary, idx]);
    }
  }

  // 6. Avis clients par défaut
  const sampleProducts = await db.queryAll('SELECT id FROM products LIMIT 5');
  const reviewComments = [
    { name: 'Awa Diallo', rating: 5, comment: 'Très satisfaite de ma commande reçue à Dakar en moins de 24h ! Qualité au top et prix très abordable.' },
    { name: 'Mame Diarra', rating: 5, comment: 'Le service client sur WhatsApp est super réactif. L’article correspond exactement à la photo.' },
    { name: 'Aminata Ba', rating: 5, comment: 'Salma Shop tient sa promesse : se vêtir à tous prix selon son budget. Je recommande vivement !' }
  ];

  for (const p of sampleProducts) {
    for (const r of reviewComments) {
      await db.execute(`
        INSERT INTO reviews (product_id, user_name, rating, comment, status)
        VALUES (?, ?, ?, ?, 'approved')
      `, [p.id, r.name, r.rating, r.comment]);
    }
  }

  console.log('✅ Base de données Salma Shop initialisée avec succès avec les 10 catégories d’articles divers !');
}

// Exécution directe
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Erreur lors du seed:', err);
      process.exit(1);
    });
}
