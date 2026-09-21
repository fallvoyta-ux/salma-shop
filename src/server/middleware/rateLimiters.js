import rateLimit from 'express-rate-limit';

/**
 * 1. Limitation anti force-brute sur l'authentification (login, register)
 * 30 requêtes / 15 minutes / IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 2. Limitation anti-inondation sur la création de commandes (POST /api/orders)
 * 40 requêtes / 15 minutes / IP
 */
export const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    message: 'Trop de commandes passées récemment. Veuillez patienter quelques minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 3. Limitation spécifique sur le suivi public de commande (GET /api/orders/track/:orderNumber)
 * Protection anti-énumération / anti-brute-force sur les numéros et codes secrets de suivi
 * 10 requêtes / 15 minutes / IP
 */
export const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Trop de requêtes de suivi. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 4. Limitation sur les endpoints de paiement (Wave, OM, PayTech, verify)
 * 60 requêtes / 15 minutes / IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Trop de requêtes de paiement. Veuillez patienter.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 5. Limitation anti-spam sur les avis publics et messages de contact
 * 10 requêtes / 60 minutes / IP
 */
export const publicWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Trop d’envois depuis votre appareil. Veuillez réessayer dans une heure.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
