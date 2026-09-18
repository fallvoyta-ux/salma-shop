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
  storePhone: process.env.STORE_PHONE || '+221 78 340 48 39',
  storePhoneAlt1: '+221 76 251 11 12',
  storePhoneAlt2: '+221 77 201 86 97',
  storeWhatsApp: process.env.STORE_WHATSAPP || '221783404839',
  storeEmail: process.env.STORE_EMAIL || 'contact@salmashop.sn',
  storeAddress: process.env.STORE_ADDRESS || 'Dakar, Sénégal',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'FCFA',

  // Paramètres Paiement Sénégal
  paymentMode: process.env.PAYMENT_MODE || 'test', // 'test' ou 'live'
  wave: {
    apiKey: process.env.WAVE_API_KEY || '',
    businessId: process.env.WAVE_BUSINESS_ID || '',
    webhookSecret: process.env.WAVE_WEBHOOK_SECRET || ''
  },
  orangeMoney: {
    clientId: process.env.ORANGE_MONEY_CLIENT_ID || '',
    clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || '',
    merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY || ''
  },
  paytech: {
    apiKey: process.env.PAYTECH_API_KEY || '',
    apiSecret: process.env.PAYTECH_API_SECRET || ''
  }
};
