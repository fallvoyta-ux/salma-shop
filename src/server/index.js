import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { config, validateConfig } from './config.js';
import { db, initSchema } from './db/connection.js';
import { seedDatabase } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { requireAdmin } from './middleware/adminAuth.js';
import { authLimiter, paymentLimiter, publicWriteLimiter } from './middleware/rateLimiters.js';

// Import des routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Validation environnement de démarrage
validateConfig();

const app = express();

// En-têtes HTTP de sécurité renforcés
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (config.env === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.removeHeader('X-Powered-By');
  next();
});
// Render / Railway placent l'application derrière un proxy inverse.
// Sans cette ligne, express-rate-limit voit la même IP pour tous les visiteurs.
app.set('trust proxy', 1);
app.use(compression());

// Configuration CORS sécurisée
const allowedOrigins = [
  'https://salmashop.onrender.com',
  'https://www.salmashop.sn',
  config.clientUrl
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requêtes sans origine (app mobile, curl, même domaine) : autorisées
    if (!origin) return callback(null, true);

    if (config.env !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origine CORS non autorisée'));
  },
  credentials: true
}));

// Body parsers avec capture de req.rawBody pour la vérification des signatures de webhooks (Wave HMAC)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dossier pour les fichiers téléversés
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

// Servir les fichiers téléversés avec restauration automatique depuis la DB si le conteneur a redémarré
app.get('/uploads/:filename', async (req, res, next) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(config.uploadsDir, safeFilename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  try {
    const fileRow = await db.queryOne('SELECT mime_type, data FROM uploaded_files WHERE filename = ?', [safeFilename]);
    if (fileRow && fileRow.data) {
      try {
        fs.writeFileSync(filePath, Buffer.from(fileRow.data));
      } catch (writeErr) {}
      res.setHeader('Content-Type', fileRow.mime_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(Buffer.from(fileRow.data));
    }
  } catch (dbErr) {
    console.warn('Note restauration média DB:', dbErr.message);
  }

  next();
});
app.use('/uploads', express.static(config.uploadsDir));

// Servir les fichiers statiques du dossier public (logos, icônes SVG)
const publicDir = path.resolve(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Enregistrement des routes API avec limiteurs de débit modulaires
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
// /api/orders utilise orderCreationLimiter (40/15min) sur POST / et trackingLimiter (10/15min) sur GET /track/:orderNumber
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/reviews', publicWriteLimiter, reviewRoutes);
app.use('/api/delivery-zones', deliveryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', publicWriteLimiter, contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: config.storeName,
    paymentMode: config.paymentMode,
    timestamp: new Date().toISOString()
  });
});

// En production, servir les fichiers statiques construits par Vite
const distPath = path.resolve(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Gestionnaire d'erreurs global
app.use(errorHandler);

// Initialisation ordonnée de la base de données PUIS démarrage du serveur
async function startServer() {
  try {
    await initSchema();

    // Vérifier si la base de données contient des produits, sinon lancer le seed
    const count = await db.queryOne('SELECT COUNT(*) as count FROM products');
    const totalCount = count ? parseInt(count.count, 10) : 0;
    if (totalCount === 0) {
      console.log('📦 Base de données vide détectée. Lancement automatique du seed initial...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la DB:', err);
  }

  return app.listen(config.port, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 GLOBAL BUSINESS SERVICES GRP SF - GROUPE SALMA FALL`);
    console.log(`🌐 URL : http://localhost:${config.port}`);
    console.log(`💳 Mode Paiement : [${config.paymentMode.toUpperCase()}]`);
    console.log(`======================================================\n`);
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun) {
  startServer();
}

export { app, startServer };
export default app;
