import express from 'express';
import { db } from '../db/connection.js';
import { config } from '../config.js';

const router = express.Router();

/**
 * POST /api/contact
 * Reçoit un message du formulaire de contact et l'enregistre en base
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Le numéro de téléphone ou WhatsApp est obligatoire.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Le message ne peut pas être vide.' });
    }

    // Assurer que la table contacts existe
    if (db.isPostgres()) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          is_read SMALLINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    await db.execute(`
      INSERT INTO contacts (name, email, phone, message)
      VALUES (?, ?, ?, ?)
    `, [name.trim(), (email || '').trim().toLowerCase(), phone.trim(), message.trim()]);

    // Générer le lien WhatsApp pour ouvrir la discussion avec Salma Shop
    const targetPhone = (config.storeWhatsApp || '221772018697').replace(/[^0-9]/g, '');
    const waText = `Bonjour ${config.storeName} ! 👋\n\n` +
      `📩 *NOUVEAU MESSAGE DE CONTACT*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Nom* : ${name.trim()}\n` +
      `📞 *Téléphone* : ${phone.trim()}\n` +
      `✉️ *Email* : ${email ? email.trim() : 'Non renseigné'}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `💬 *Message* :\n${message.trim()}\n\n` +
      `Merci ! 💜🕊️`;

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waText)}`;

    res.status(201).json({
      success: true,
      message: 'Votre message a été enregistré avec succès !',
      whatsappUrl
    });
  } catch (err) {
    next(err);
  }
});

export default router;
