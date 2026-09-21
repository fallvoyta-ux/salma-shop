import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/connection.js';

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.headers.cookie) {
    try {
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k, decodeURIComponent(v.join('='))];
        })
      );
      return cookies.salma_token || cookies.token || null;
    } catch (e) {
      return null;
    }
  }

  return null;
}

export async function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise. Veuillez vous connecter.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.queryOne('SELECT id, first_name, last_name, email, phone, role, address, city, region FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable ou session expirée.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session invalide ou expirée. Veuillez vous reconnecter.'
    });
  }
}

// Middleware optionnel (permet d'attacher l'utilisateur si connecté sans bloquer si invité)
export async function optionalAuthenticate(req, res, next) {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await db.queryOne('SELECT id, first_name, last_name, email, phone, role, address, city, region FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // Ignore token error for optional auth
    }
  }
  next();
}
