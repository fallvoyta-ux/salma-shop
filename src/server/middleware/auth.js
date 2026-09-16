import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/connection.js';

export function authenticate(req, res, next) {
  let token = null;

  // Récupération depuis le header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    // Ou depuis un cookie token
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    token = cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise. Veuillez vous connecter.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.queryOne('SELECT id, first_name, last_name, email, phone, role, address, city, region FROM users WHERE id = ?', [decoded.id]);

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
export function optionalAuthenticate(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = db.queryOne('SELECT id, first_name, last_name, email, phone, role, address, city, region FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // Ignore token error for optional auth
    }
  }
  next();
}
