import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbFilePath: path.resolve(rootDir, process.env.DB_FILE_PATH || 'database.sqlite'),
  uploadsDir: path.resolve(rootDir, 'uploads'),

  // Identité Officielle Global Business Services Grp SF (Groupe Salma Fall)
  storeName: process.env.STORE_NAME || 'Global Business Services Grp SF',
  storeSubtitle: 'Groupe Salma Fall - Vente Articles Divers',
  storeSlogan: 'La Qualité fait la Différence 💜🕊️🌹',
  storePhone: process.env.STORE_PHONE || '+221 77 201 86 97',
  storePhoneAlt1: '+221 76 251 11 12',
  storeWhatsApp: process.env.STORE_WHATSAPP || '221772018697',
  storeEmail: process.env.STORE_EMAIL || 'contact@salmashop.sn',
  storeAddress: process.env.STORE_ADDRESS || 'Dakar, Sénégal',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'FCFA',

  // Paramètres Paiement Sénégal
  paymentMode: process.env.PAYMENT_MODE || (process.env.NODE_ENV === 'production' ? '' : 'test'), // 'test' ou 'live'
  wave: {
    apiKey: process.env.WAVE_API_KEY || '',
    businessId: process.env.WAVE_BUSINESS_ID || 'M_5iS6VUrJnTx-',
    merchantUrl: process.env.WAVE_MERCHANT_URL || 'https://pay.wave.com/m/M_5iS6VUrJnTx-/c/sn/',
    merchantName: 'Groupe SALMA FALL',
    webhookSecret: process.env.WAVE_WEBHOOK_SECRET || ''
  },
  orangeMoney: {
    clientId: process.env.ORANGE_MONEY_CLIENT_ID || '',
    clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || '',
    merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY || '',
    qrUrl: process.env.ORANGE_MONEY_QR_URL || 'https://qrcode.orange.sn/dcnYNsnEy5lJG79Nh7DAxLPcCEX',
    qrImage: '/orange_money_qr_clean.png'
  },
  paytech: {
    apiKey: process.env.PAYTECH_API_KEY || '',
    apiSecret: process.env.PAYTECH_API_SECRET || ''
  }
};

export function validateConfig() {
  const isProd = config.env === 'production';
  const fatal = [];

  // Exigence absolue de clé secrète JWT : pas de fallback en dur
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    if (isProd) {
      fatal.push('JWT_SECRET manquant ou trop court (minimum 32 caractères requis en production).');
    } else {
      console.warn('⚠️ ATTENTION : JWT_SECRET absent ou inférieur à 32 caractères. Veuillez configurer JWT_SECRET dans .env.');
    }
  }

  // Exigence absolue de PAYMENT_MODE explicite en production (refus du fallback silencieux 'test')
  if (isProd) {
    if (!process.env.PAYMENT_MODE) {
      fatal.push('PAYMENT_MODE absent en production. Le démarrage est refusé : définissez explicitement PAYMENT_MODE=live ou PAYMENT_MODE=test.');
    } else if (!['live', 'test'].includes(process.env.PAYMENT_MODE)) {
      fatal.push(`PAYMENT_MODE='${process.env.PAYMENT_MODE}' non reconnu en production. Valeurs autorisées : 'live' ou 'test'.`);
    }

    if (config.paymentMode === 'live') {
      if (!process.env.WAVE_WEBHOOK_SECRET) {
        fatal.push('PAYMENT_MODE=live mais WAVE_WEBHOOK_SECRET est absent.');
      }
    }
  }

  if (fatal.length > 0) {
    console.error('\n🛑 DÉMARRAGE ANNULÉ — configuration de production invalide :');
    fatal.forEach(m => console.error(`   • ${m}`));
    process.exit(1);
  }

  if (isProd && !process.env.DATABASE_URL) {
    console.warn('⚠️ Aucune DATABASE_URL : SQLite local utilisé, les données seront perdues au redémarrage.');
  }
}

