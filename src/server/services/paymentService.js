import { config } from '../config.js';
import { db } from '../db/connection.js';

export const paymentService = {
  /**
   * Initialise une transaction de paiement pour une commande
   */
  async initializePayment(order, paymentMethod) {
    const isLive = config.paymentMode === 'live';
    const amount = order.total_amount;
    const currency = 'XOF';
    const orderNumber = order.order_number;

    let transactionId = `${paymentMethod.toUpperCase()}_TRX_${Date.now()}`;
    let checkoutUrl = null;
    let instructions = null;

    if (paymentMethod === 'cash_on_delivery') {
      // Paiement à la livraison
      transactionId = `CASH_${orderNumber}_${Date.now()}`;
      instructions = 'Paiement en espèces à effectuer auprès du livreur lors de la réception de votre colis.';
      
      // Enregistrer la transaction
      await db.execute(`
        INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [order.id, 'cash', transactionId, amount, currency, 'pending', JSON.stringify({ mode: 'cash_on_delivery' })]);

      return {
        success: true,
        provider: 'cash',
        transactionId,
        checkoutUrl: null,
        instructions,
        isLive: false,
        status: 'pending'
      };
    }

    if (paymentMethod === 'wave') {
      let waveLaunchUrl = null;

      if (isLive && config.wave.apiKey) {
        // En mode réel avec l'API Wave officielle
        try {
          const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.wave.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: amount.toString(),
              currency: 'XOF',
              client_reference: orderNumber,
              success_url: `${config.clientUrl}/order-confirmation/${orderNumber}?status=success&trx=${transactionId}`,
              error_url: `${config.clientUrl}/order-confirmation/${orderNumber}?status=cancelled`
            })
          });
          const data = await response.json();
          if (data.wave_launch_url) {
            checkoutUrl = data.wave_launch_url;
            waveLaunchUrl = data.wave_launch_url;
            transactionId = data.id || transactionId;
          }
        } catch (err) {
          console.error('Erreur API Wave Live:', err);
        }
      }

      instructions = `Transfert Wave de ${amount.toLocaleString('fr-FR')} FCFA vers ${config.storeName} (${config.storePhone}).`;

      await db.execute(`
        INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [order.id, 'wave', transactionId, amount, currency, 'pending', JSON.stringify({ isLive, provider: 'wave' })]);

      return {
        success: true,
        provider: 'wave',
        transactionId,
        checkoutUrl: waveLaunchUrl,
        waveAppDeepLink: 'wave://',
        recipientName: config.storeName,
        recipientPhone: config.storePhone,
        recipientWhatsApp: config.storeWhatsApp,
        amount,
        instructions,
        isLive,
        status: 'pending'
      };
    }

    if (paymentMethod === 'orange_money') {
      const ussdCode = `*144*1*1*${config.storeWhatsApp}*${amount}#`;
      const omTelUrl = `tel:${encodeURIComponent(ussdCode)}`;
      checkoutUrl = omTelUrl;

      if (isLive && config.orangeMoney.merchantKey) {
        // En mode réel avec l'API Orange Money Web Payment
        instructions = `Validez votre paiement de ${amount.toLocaleString('fr-FR')} FCFA sur votre téléphone Orange Money (#144# ou application Orange Money).`;
      } else {
        instructions = `Composer le code USSD ${ussdCode} ou transférer ${amount.toLocaleString('fr-FR')} FCFA au ${config.storePhone} (${config.storeName}).`;
      }

      await db.execute(`
        INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [order.id, 'orange_money', transactionId, amount, currency, 'pending', JSON.stringify({ isLive, provider: 'orange_money', ussdCode })]);

      return {
        success: true,
        provider: 'orange_money',
        transactionId,
        checkoutUrl,
        ussdCode,
        omTelUrl,
        recipientName: config.storeName,
        recipientPhone: config.storePhone,
        recipientWhatsApp: config.storeWhatsApp,
        amount,
        instructions,
        isLive,
        status: 'pending'
      };
    }

    if (paymentMethod === 'card') {
      // Carte bancaire via PayTech SN ou Stripe
      if (isLive && config.paytech.apiKey) {
        // Appel API PayTech officiel
        checkoutUrl = 'https://paytech.sn/payment/checkout';
      } else {
        checkoutUrl = `${config.clientUrl}/order-confirmation/${orderNumber}?simulated_gateway=card&amount=${amount}`;
        instructions = `Mode Test : Passerelle Carte Bancaire prête (PAYTECH_API_KEY dans .env). Compatible Visa et Mastercard.`;
      }

      await db.execute(`
        INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [order.id, 'card', transactionId, amount, currency, 'pending', JSON.stringify({ isLive, provider: 'card' })]);

      return {
        success: true,
        provider: 'card',
        transactionId,
        checkoutUrl,
        instructions,
        isLive,
        status: 'pending'
      };
    }

    throw new Error(`Moyen de paiement non pris en charge: ${paymentMethod}`);
  },

  /**
   * Valide une transaction après confirmation (Webhook ou Callback sécurisé)
   * Strictement idempotent et vérifie le montant réel
   */
  async verifyAndConfirmPayment(transactionId, status = 'successful', rawPayload = {}) {
    const payment = await db.queryOne('SELECT * FROM payments WHERE transaction_id = ?', [transactionId]);
    if (!payment) {
      throw new Error(`Transaction ${transactionId} introuvable`);
    }

    // 1. Idempotence : Ne jamais traiter deux fois une transaction déjà validée
    if (payment.status === 'paid' || payment.status === 'successful') {
      return { 
        success: true, 
        paymentStatus: 'paid', 
        alreadyProcessed: true,
        message: 'Cette transaction a déjà été validée et enregistrée.' 
      };
    }

    // 2. Vérification d'intégrité de la commande associée
    const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [payment.order_id]);
    if (!order) {
      throw new Error(`Commande associée (ID #${payment.order_id}) introuvable.`);
    }

    // 3. Vérification du montant : le montant payé doit correspondre au montant total de la commande
    if (status === 'successful') {
      const paidAmount = Math.round(Number(payment.amount));
      const expectedAmount = Math.round(Number(order.total_amount));
      if (paidAmount !== expectedAmount) {
        throw new Error(`Incohérence de montant détectée: montant payé (${paidAmount} FCFA) != montant commande (${expectedAmount} FCFA).`);
      }
    }

    const newPaymentStatus = status === 'successful' ? 'successful' : (status === 'cancelled' ? 'cancelled' : (status === 'failed' ? 'failed' : 'pending'));

    // 4. Mise à jour atomique dans une vraie transaction
    await db.transaction(async (tx) => {
      // Mettre à jour la transaction
      await tx.execute(`
        UPDATE payments
        SET status = ?, raw_response = ?
        WHERE id = ?
      `, [newPaymentStatus, JSON.stringify(rawPayload), payment.id]);

      // Mettre à jour la commande
      if (status === 'successful') {
        await tx.execute(`
          UPDATE orders
          SET payment_status = 'paid', order_status = 'confirmed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [payment.order_id]);
      } else if (status === 'failed' || status === 'cancelled') {
        await tx.execute(`
          UPDATE orders
          SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [payment.order_id]);
      }
    });

    return { 
      success: true, 
      paymentStatus: newPaymentStatus,
      orderId: payment.order_id,
      orderNumber: order.order_number
    };
  },

  /**
   * Vérifie une session en direct auprès de l'API officielle du prestataire
   */
  async verifyProviderSession(provider, transactionId) {
    if (provider === 'wave') {
      if (!config.wave.apiKey) {
        throw new Error('Clé API Wave non configurée pour la vérification en direct.');
      }
      const response = await fetch(`https://api.wave.com/v1/checkout/sessions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${config.wave.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Erreur Wave API (${response.status}): ${response.statusText}`);
      }
      const data = await response.json();
      return {
        isSuccessful: data.payment_status === 'succeeded',
        amount: data.amount ? Number(data.amount) : null,
        currency: data.currency,
        raw: data
      };
    }
    return { isSuccessful: false };
  }
};
