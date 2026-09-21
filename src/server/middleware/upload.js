import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { db } from '../db/connection.js';

/**
 * Stockage des images produits.
 *
 * 1. Si CLOUDINARY_URL est défini : téléversement direct sur Cloudinary (permanent, WebP auto).
 * 2. Si CLOUDINARY_URL est absent : stockage local avec réplication automatique dans la
 *    table SQL `uploaded_files` (BYTEA / BLOB). Ainsi, même sur le disque éphémère de Render,
 *    aucune image n'est perdue : le serveur la restaure automatiquement depuis la DB au redémarrage !
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
      '⚠️ Erreur initialisation Cloudinary, bascule sur la persistance en base de données locale/PostgreSQL.'
    );
  }
}

if (!storage) {
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
  }

  console.log('📦 Stockage des images : Persistance en base de données (table uploaded_files) + cache disque.');

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
 * Persiste automatiquement les fichiers téléversés dans la table `uploaded_files`
 * si Cloudinary n'est pas configuré.
 */
export async function persistUploadedFiles(files) {
  if (usingCloudinary || !files) return;
  const list = Array.isArray(files) ? files : [files];
  for (const f of list) {
    if (!f || !f.path || !fs.existsSync(f.path)) continue;
    try {
      const buffer = fs.readFileSync(f.path);
      await db.execute(`
        INSERT INTO uploaded_files (filename, mime_type, data, size_bytes)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(filename) DO UPDATE SET data = excluded.data, size_bytes = excluded.size_bytes
      `, [f.filename, f.mimetype, buffer, f.size]);
    } catch (err) {
      console.warn(`Note persistance image ${f.filename} en base:`, err.message);
    }
  }
}

/**
 * Renvoie l'URL à enregistrer en base pour un fichier téléversé.
 * Cloudinary place l'URL complète dans file.path ; le stockage local
 * sert depuis /uploads.
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
