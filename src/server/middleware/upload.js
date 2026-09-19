import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

/**
 * Stockage des images produits.
 *
 * Sur Render (plan gratuit) le disque est ÉPHÉMÈRE : tout fichier écrit dans
 * /uploads disparaît au prochain déploiement ou redémarrage. Si la variable
 * CLOUDINARY_URL est définie, les images sont donc envoyées sur Cloudinary
 * (gratuit, permanent, redimensionnement et WebP automatiques).
 * Sinon, on retombe sur le disque local, ce qui reste parfait en développement.
 */

const cloudinaryUrl = (process.env.CLOUDINARY_URL || '').trim();
let storage = null;
export let usingCloudinary = false;

if (cloudinaryUrl) {
  try {
    const { v2: cloudinary } = await import('cloudinary');
    const { CloudinaryStorage } = await import('multer-storage-cloudinary');

    cloudinary.config({ secure: true }); // lit CLOUDINARY_URL automatiquement

    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'salmashop/produits',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ]
      }
    });

    usingCloudinary = true;
    console.log('🖼️  Stockage des images : Cloudinary (permanent)');
  } catch (err) {
    console.warn(
      '⚠️ CLOUDINARY_URL est définie mais les paquets sont absents.\n' +
      '   Lancez : npm install cloudinary multer-storage-cloudinary\n' +
      '   Repli temporaire sur le disque local (images perdues au redéploiement).'
    );
  }
}

if (!storage) {
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
  }

  if (config.env === 'production') {
    console.warn(
      '⚠️ Images stockées sur le disque local en production.\n' +
      '   Sur Render, elles seront PERDUES à chaque déploiement.\n' +
      '   Définissez CLOUDINARY_URL pour un stockage permanent.'
    );
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
    }
  });
}

/**
 * Renvoie l'URL à enregistrer en base pour un fichier téléversé.
 * Cloudinary place l'URL complète dans file.path ; le disque local
 * n'a qu'un nom de fichier servi depuis /uploads.
 */
export function fileUrl(file) {
  if (!file) return null;
  if (usingCloudinary && file.path && /^https?:\/\//.test(file.path)) {
    return file.path;
  }
  return `/uploads/${file.filename}`;
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Utilisez JPG, PNG, WEBP ou GIF.'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo maximum
  fileFilter
});
