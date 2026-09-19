import express from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import { db } from '../db/connection.js';
import { paymentService } from '../services/paymentService.js';
/**
 * Comparaison à temps constant qui ne lève pas d'exception
 * si les deux chaînes ont des longueurs différentes.
 */
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const IS_LIVE = config.paymentMode === 'live';

const router = express.Router();

/**
 * POST /api/payments/verify
 * Vérifie et confirme un paiement.
 * En mode LIVE : Ne fait JAMAIS confiance au statut envoyé par le client ;
 * interroge directement le prestataire ou exige une preuve cryptographique.
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { transaction_id, status = 'successful' } = req.body;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant de transaction requis.'
      });
    }

    // Récupérer la transaction en base
    const payment = await db.queryOne('SELECT * FROM payments WHERE transaction_id = ?', [transaction_id]);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Transaction ${transaction_id} introuvable.`
      });
    }

    // Idempotence : si déjà payée, retourner le succès sans ré-exécuter
    if (payment.status === 'paid' || payment.status === 'successful') {
      return res.json({
        success: true,
        message: 'Cette transaction a déjà été confirmée.',
        result: {
          success: true,
          paymentStatus: 'paid',
          alreadyProcessed: true
        }
      });
    }

    const isLive = config.paymentMode === 'live';

    if (isLive) {
      // 1. Paiement à la livraison : impossible à marquer "payé" par le client via l'API publique
      if (payment.provider === 'cash') {
        return res.status(403).json({
          success: false,
          message: 'Les commandes avec paiement à la livraison sont validées uniquement par l’administrateur ou le livreur.'
        });
      }

      // 2. Wave Live : vérifier auprès de l'API officielle Wave
      if (payment.provider === 'wave') {
        try {
          const waveCheck = await paymentService.verifyProviderSession('wave', transaction_id);
          if (!waveCheck.isSuccessful) {
            return res.status(400).json({
              success: false,
              message: 'La transaction n’est pas encore validée par Wave.'
            });
          }
        } catch (waveErr) {
          return res.status(400).json({
            success: false,
            message: `Échec de vérification Wave : ${waveErr.message}`
          });
        }
      } else {
        // En mode Live pour les autres passerelles, confirmation réservée au webhook sécurisé
        return res.status(400).json({
          success: false,
          message: 'Validation en attente du webhook sécurisé du prestataire.'
        });
      }
    } else {
      // Mode Test : validation permise mais contrôlée
      if (!['successful', 'failed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut de paiement de test invalide.'
        });
      }
    }

    const result = await paymentService.verifyAndConfirmPayment(transaction_id, status, req.body);
    res.json({
      success: true,
      message: 'Paiement vérifié avec succès.',
      result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook/:provider
 * Webhook ultra-sécurisé pour les prestataires de paiement (Wave, PayTech, Orange Money).
 * - Vérifie la signature cryptographique / secret
 * - Vérifie le montant réel
 * - Vérifie la devise
 * - Garantit l'idempotence
 */
router.post('/webhook/:provider', async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  const validProviders = ['wave', 'orange_money', 'paytech'];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: `Prestataire non pris en charge: ${provider}` });
  }

  try {
    let transactionId = null;
    let paymentStatus = 'successful';
    let receivedAmount = null;
    let currency = 'XOF';

    // 1. Vérification spécifique par prestataire
    if (provider === 'wave') {
      // ÉCHEC FERMÉ : en production, pas de secret = pas de webhook accepté.
      if (!config.wave.webhookSecret) {
        if (IS_LIVE) {
          console.error('🛑 Webhook Wave refusé : WAVE_WEBHOOK_SECRET non configuré.');
          return res.status(503).json({ error: 'Webhook non configuré.' });
        }
      }

      if (config.wave.webhookSecret) {
        const sigHeader = req.headers['wave-signature'] || req.headers['Wave-Signature'];
        if (!sigHeader) {
          console.warn('⚠️ Webhook Wave rejeté : en-tête Wave-Signature manquant');
          return res.status(401).json({ error: 'En-tête Wave-Signature requis.' });
        }

        const parts = Object.fromEntries(
          sigHeader.split(',').map(kv => kv.trim().split('='))
        );
        const timestamp = parts.t;
        const signature = parts.v1;

        if (!timestamp || !signature) {
          return res.status(401).json({ error: 'Format de signature Wave invalide.' });
        }

        // Protection contre les attaques par rejeu (5 minutes max)
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
          console.warn('⚠️ Webhook Wave rejeté : horodatage expiré');
          return res.status(401).json({ error: 'Horodatage Wave expiré.' });
        }

        const rawBodyText = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(payload);
        const expectedSignature = crypto
          .createHmac('sha256', config.wave.webhookSecret)
          .update(`${timestamp}.${rawBodyText}`)
          .digest('hex');

        if (!safeCompare(signature, expectedSignature)) {
          console.warn('⚠️ Webhook Wave rejeté : signature falsifiée');
          return res.status(401).json({ error: 'Signature Wave falsifiée ou invalide.' });
        }
      }

      transactionId = payload?.data?.id || payload?.data?.client_reference || payload?.client_reference;
      paymentStatus = payload?.type === 'checkout.session.completed' ? 'successful' : 'failed';
      receivedAmount = payload?.data?.amount ? Number(payload?.data?.amount) : null;
      currency = payload?.data?.currency || 'XOF';

    } else if (provider === 'paytech') {
      // Vérification signature PayTech
      if (!config.paytech.apiKey || !config.paytech.apiSecret) {
        if (IS_LIVE) {
          console.error('🛑 Webhook PayTech refusé : clés non configurées.');
          return res.status(503).json({ error: 'Webhook non configuré.' });
        }
      }

      if (config.paytech.apiKey && config.paytech.apiSecret) {
        const expectedApiKeySha = crypto.createHash('sha256').update(config.paytech.apiKey).digest('hex');
        const expectedApiSecretSha = crypto.createHash('sha256').update(config.paytech.apiSecret).digest('hex');

        if (
          !safeCompare(payload.api_key_sha256, expectedApiKeySha) ||
          !safeCompare(payload.api_secret_sha256, expectedApiSecretSha)
        ) {
          console.warn('⚠️ Webhook PayTech rejeté : clés de signature non valides');
          return res.status(401).json({ error: 'Signature PayTech non valide.' });
        }
      }

      transactionId = payload?.token || payload?.ref_command;
      paymentStatus = payload?.type_event === 'sale_complete' ? 'successful' : 'failed';
      receivedAmount = payload?.item_price || payload?.amount ? Number(payload?.item_price || payload?.amount) : null;
      currency = payload?.currency || 'XOF';

    } else if (provider === 'orange_money') {
      // Vérification clé marchande Orange Money IPN
      if (!config.orangeMoney.merchantKey) {
        if (IS_LIVE) {
          console.error('🛑 Webhook Orange Money refusé : ORANGE_MONEY_MERCHANT_KEY non configurée.');
          return res.status(503).json({ error: 'Webhook non configuré.' });
        }
      } else {
        const authHeader = req.headers['authorization'] || req.headers['x-om-signature'] || payload?.merchant_key;
        // Un en-tête ABSENT doit être refusé, pas laissé passer.
        if (!authHeader || !String(authHeader).includes(config.orangeMoney.merchantKey)) {
          console.warn('⚠️ Webhook Orange Money rejeté : clé marchande absente ou incorrecte');
          return res.status(401).json({ error: 'Authentification Orange Money refusée.' });
        }
      }

      transactionId = payload?.notif_token || payload?.txnid || payload?.order_id;
      paymentStatus = payload?.status === 'SUCCESS' ? 'successful' : 'failed';
      receivedAmount = payload?.amount ? Number(payload?.amount) : null;
      currency = payload?.currency || 'XOF';
    }

    if (!transactionId) {
      return res.status(400).json({ error: 'Référence de transaction introuvable dans le payload.' });
    }

    // 2. Recherche de la transaction en base de données
    const payment = await db.queryOne('SELECT * FROM payments WHERE transaction_id = ?', [transactionId]);
    if (!payment) {
      console.warn(`⚠️ Webhook ${provider} : transaction ${transactionId} introuvable en base`);
      return res.status(404).json({ error: `Transaction ${transactionId} inconnue.` });
    }

    // 3. Vérification du montant et de la devise
    if (paymentStatus === 'successful' && receivedAmount !== null) {
      const expectedAmount = Math.round(Number(payment.amount));
      if (Math.round(receivedAmount) !== expectedAmount) {
        console.error(`🚨 FRAUDE DÉTECTÉE sur transaction ${transactionId}: reçu ${receivedAmount} ${currency}, attendu ${expectedAmount}`);
        return res.status(400).json({ error: 'Incohérence de montant détectée.' });
      }
    }

    // 4. Exécuter la confirmation idempotente
    const confirmation = await paymentService.verifyAndConfirmPayment(transactionId, paymentStatus, payload);

    return res.status(200).json({
      received: true,
      orderNumber: confirmation.orderNumber,
      paymentStatus: confirmation.paymentStatus
    });
  } catch (err) {
    console.error(`❌ Erreur traitement Webhook ${provider}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
