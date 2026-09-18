import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/connection.js';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// Inscription client
router.post('/register', async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password, address, city, region } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner votre prénom, nom, adresse email et mot de passe.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit comporter au moins 6 caractères.'
      });
    }

    const existing = await db.queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cette adresse email.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.execute(`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role, address, city, region)
      VALUES (?, ?, ?, ?, ?, 'client', ?, ?, ?)
    `, [
      first_name.trim(),
      last_name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : null,
      passwordHash,
      address || null,
      city || 'Dakar',
      region || 'Dakar'
    ]);

    const newUser = await db.queryOne(
      'SELECT id, first_name, last_name, email, phone, role, address, city, region, created_at FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès ! Bienvenue sur Global Business Services Grp SF.',
      token,
      user: newUser
    });
  } catch (err) {
    next(err);
  }
});

// Connexion client / admin
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez saisir votre email et votre mot de passe.'
      });
    }

    const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.'
      });
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      city: user.city,
      region: user.region,
      created_at: user.created_at
    };

    res.json({
      success: true,
      message: 'Connexion réussie !',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// Récupérer le profil connecté
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Mettre à jour les informations du profil
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { first_name, last_name, phone, address, city, region } = req.body;

    await db.execute(`
      UPDATE users
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          region = COALESCE(?, region),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [first_name, last_name, phone, address, city, region, req.user.id]);

    const updatedUser = await db.queryOne(
      'SELECT id, first_name, last_name, email, phone, role, address, city, region FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
});

// Modifier le mot de passe
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez indiquer le mot de passe actuel et le nouveau mot de passe.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit comporter au moins 6 caractères.'
      });
    }

    const user = await db.queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect.'
      });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, req.user.id]);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
