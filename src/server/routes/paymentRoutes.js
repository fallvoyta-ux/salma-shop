import express from 'express';
import { db } from '../db/connection.js';
import { paymentService } from '../services/paymentService.js';

const router = express.Router();

// Vérifier et confirmer un paiement (retour du portail ou test)
router.post('/verify', async (req, res, next) => {
  try {
    const { transaction_id, status = 'successful' } = req.body;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant de transaction requis.'
      });
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

// Webhook sécurisé pour les prestataires de paiement sénégalais (Wave, Orange Money, PayTech)
router.post('/webhook/:provider', async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  try {
    let transactionId = null;
    let paymentStatus = 'successful';

    if (provider === 'wave') {
      // Wave Webhook structure : payload.data.client_reference ou payload.data.id
      transactionId = payload?.data?.id || payload?.client_reference;
      paymentStatus = payload?.type === 'checkout.session.completed' ? 'successful' : 'failed';
    } else if (provider === 'orange_money') {
      transactionId = payload?.notif_token || payload?.txnid;
      paymentStatus = payload?.status === 'SUCCESS' ? 'successful' : 'failed';
    } else if (provider === 'paytech') {
      transactionId = payload?.token || payload?.ref_command;
      paymentStatus = payload?.type_event === 'sale_complete' ? 'successful' : 'failed';
    }

    if (transactionId) {
      await paymentService.verifyAndConfirmPayment(transactionId, paymentStatus, payload);
    }

    // Répondre 200 OK au prestataire
    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Erreur Webhook ${provider}:`, err);
    res.status(200).json({ received: true, error: err.message });
  }
});

export default router;
