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
  jwtSecret: process.env.JWT_SECRET || 'salma_shop_chic_ladies_dakar_secret_jwt_2026',
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
  paymentMode: process.env.PAYMENT_MODE || 'test', // 'test' ou 'live'
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
  if (!isProd) return;

  const fatal = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    fatal.push('JWT_SECRET manquant ou trop court (32 caractères minimum requis).');
  }

  if (config.paymentMode === 'live') {
    if (!process.env.WAVE_WEBHOOK_SECRET) {
      fatal.push('PAYMENT_MODE=live mais WAVE_WEBHOOK_SECRET est absent.');
    }
  }

  if (fatal.length > 0) {
    console.error('\n🛑 DÉMARRAGE ANNULÉ — configuration de production invalide :');
    fatal.forEach(m => console.error(`   • ${m}`));
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Aucune DATABASE_URL : SQLite local utilisé, les données seront perdues au redémarrage.');
  }
}

