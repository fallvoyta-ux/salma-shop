/**
 * SALMA SHOP - AUDIT & VÉRIFICATION DE DÉPLOIEMENT PRODUCTION (RENDER)
 * Global Business Services Grp SF (Groupe Salma Fall)
 *
 * Exécution : node src/server/scripts/checkProductionReady.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '../config.js';
import { db, initSchema } from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const { Pool } = pg;

async function runProductionCheck() {
  console.log('\n======================================================');
  console.log('🚀 SALMA SHOP - AUDIT PRÉ-DÉPLOIEMENT RENDER / PRODUCTION');
  console.log('======================================================\n');

  let errors = 0;
  let warnings = 0;

  // 1. Environnement & Port
  console.log('1️⃣ ENVIRONNEMENT & CONFIGURATION GÉNÉRALE');
  console.log(`   • NODE_ENV : ${process.env.NODE_ENV || 'non défini (défaut: development)'}`);
  console.log(`   • PORT : ${config.port}`);
  console.log(`   • CLIENT_URL : ${config.clientUrl}`);
  console.log(`   • Boutique : ${config.storeName} (${config.storePhone})`);

  // 2. Secret JWT
  console.log('\n2️⃣ AUTHENTIFICATION & SÉCURITÉ JWT');
  const jwtSecret = process.env.JWT_SECRET || '';
  if (!jwtSecret) {
    console.error('   ❌ JWT_SECRET est vide ! Le serveur refusera de démarrer en production.');
    errors++;
  } else if (jwtSecret.length < 32) {
    console.error(`   ❌ JWT_SECRET est trop court (${jwtSecret.length} caractères, minimum 32 requis).`);
    errors++;
  } else {
    console.log(`   ✅ JWT_SECRET configuré avec succès (${jwtSecret.length} caractères).`);
  }

  // 3. Base de données PostgreSQL (Render / Neon / Supabase)
  console.log('\n3️⃣ BASE DE DONNÉES (POSTGRESQL)');
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    console.warn('   ⚠️ DATABASE_URL est absent. SQLite local est utilisé.');
    console.warn('      Sur Render (plan gratuit), le disque est éphémère : les commandes et utilisateurs');
    console.warn('      seront perdus à chaque redéploiement.');
    warnings++;
  } else {
    console.log(`   • DATABASE_URL détecté : ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
    try {
      const isLocalDb = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
      const testPool = new Pool({
        connectionString: dbUrl,
        ssl: isLocalDb ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      const client = await testPool.connect();
      const res = await client.query('SELECT current_database(), version();');
      console.log(`   ✅ Connexion PostgreSQL réussie ! Base: ${res.rows[0].current_database}`);
      client.release();
      await testPool.end();
    } catch (pgErr) {
      console.error(`   ❌ Impossible de se connecter à PostgreSQL : ${pgErr.message}`);
      errors++;
    }
  }

  // 4. Mode de Paiement & Webhooks
  console.log('\n4️⃣ MODE DE PAIEMENT & WEBHOOKS (WAVE, PAYTECH, ORANGE MONEY)');
  const paymentMode = process.env.PAYMENT_MODE || '';
  console.log(`   • PAYMENT_MODE : "${paymentMode}"`);

  if (!paymentMode) {
    if (process.env.NODE_ENV === 'production') {
      console.error('   ❌ PAYMENT_MODE est obligatoire en production (doit valoir "live" ou "test").');
      errors++;
    } else {
      console.warn('   ⚠️ PAYMENT_MODE absent (défaut test en développement).');
    }
  } else if (!['live', 'test'].includes(paymentMode)) {
    console.error(`   ❌ PAYMENT_MODE='${paymentMode}' invalide. Seules les valeurs 'live' ou 'test' sont autorisées.`);
    errors++;
  } else {
    console.log(`   ✅ PAYMENT_MODE est valide : [${paymentMode.toUpperCase()}]`);
  }

  // Vérification Wave
  console.log('\n   🌊 Configuration Wave Sénégal :');
  if (config.wave.businessId) {
    console.log(`     ✓ Business ID : ${config.wave.businessId}`);
  } else {
    console.warn('     ⚠️ WAVE_BUSINESS_ID absent.');
  }

  if (paymentMode === 'live') {
    if (!process.env.WAVE_WEBHOOK_SECRET) {
      console.error('     ❌ WAVE_WEBHOOK_SECRET manquant pour PAYMENT_MODE=live !');
      errors++;
    } else {
      console.log('     ✅ WAVE_WEBHOOK_SECRET configuré.');
    }
    if (!process.env.WAVE_API_KEY) {
      console.warn('     ⚠️ WAVE_API_KEY absent (Wave Checkout API directe non disponible).');
      warnings++;
    }
  } else {
    console.log(`     ℹ️ En mode test, les transactions Wave sont simulées ou redirigent vers le lien marchand.`);
  }

  // Vérification PayTech
  console.log('\n   💳 Configuration PayTech Sénégal :');
  if (config.paytech.apiKey && config.paytech.apiSecret) {
    console.log('     ✅ Clés API PayTech configurées.');
  } else {
    console.log('     ℹ️ PayTech non configuré (optionnel si Wave et Orange Money sont utilisés directement).');
  }

  // Vérification Orange Money
  console.log('\n   🟠 Configuration Orange Money :');
  if (config.orangeMoney.merchantKey) {
    console.log('     ✅ Clé marchande Orange Money configurée.');
  } else {
    console.log('     ℹ️ QR Code dynamique et transfert manuel Orange Money actifs (+221 77 201 86 97).');
  }

  // 5. Stockage des images (Cloudinary ou Persistance Base de Données)
  console.log('\n5️⃣ STOCKAGE PERMANENT DES IMAGES PRODUITS');
  const cloudinaryUrl = (process.env.CLOUDINARY_URL || '').trim();
  if (cloudinaryUrl) {
    console.log('   ✅ CLOUDINARY_URL configuré : Les images produits sont persistées sur le cloud Cloudinary.');
  } else {
    console.log('   ✅ Repli automatique actif : Persistance en base de données (table uploaded_files).');
    console.log('      Les images téléversées sont sauvegardées en base et restaurées automatiquement après chaque redémarrage.');
  }

  // 6. Build Frontend
  console.log('\n6️⃣ BUILD FRONTEND DE PRODUCTION (DIST)');
  const distIndex = path.join(rootDir, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    const stats = fs.statSync(distIndex);
    console.log(`   ✅ Dossier dist/ présent et valide (index.html compilé le ${stats.mtime.toLocaleDateString('fr-FR')} ${stats.mtime.toLocaleTimeString('fr-FR')}).`);
  } else {
    console.warn('   ⚠️ Dossier dist/ non trouvé. Exécutez "npm run build" avant de déployer.');
    warnings++;
  }

  // 7. URLs des Webhooks pour vos tableaux de bord marchands
  const appBaseUrl = config.clientUrl.replace(/\/$/, '');
  console.log('\n======================================================');
  console.log('🔗 URLS DE WEBHOOKS À CONFIGURER SUR VOS DASHBOARDS :');
  console.log('======================================================');
  console.log(`🌊 Wave Webhook :`);
  console.log(`   ${appBaseUrl}/api/payments/webhook/wave`);
  console.log(`💳 PayTech IPN :`);
  console.log(`   ${appBaseUrl}/api/payments/webhook/paytech`);
  console.log(`🟠 Orange Money IPN :`);
  console.log(`   ${appBaseUrl}/api/payments/webhook/orange_money`);
  console.log('======================================================\n');

  // Bilan
  if (errors > 0) {
    console.error(`🛑 AUDIT TERMINÉ : ${errors} ERREUR(S) BLOQUANTE(S), ${warnings} AVERTISSEMENT(S).`);
    console.error('   Veuillez corriger les erreurs ci-dessus dans vos variables d’environnement Render avant mise en production.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`⚠️ AUDIT TERMINÉ : 0 erreur bloquante, ${warnings} avertissement(s).`);
    console.log('   L’application peut démarrer, mais vérifiez les avertissements avant d’ouvrir au public.');
    process.exit(0);
  } else {
    console.log('🎉 AUDIT PARFAIT : Tous les feux sont au vert pour la production ! 🚀\n');
    process.exit(0);
  }
}

runProductionCheck().catch(err => {
  console.error('Erreur lors du diagnostic :', err);
  process.exit(1);
});
