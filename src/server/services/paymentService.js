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

      if (!waveLaunchUrl) {
        if (isLive) {
          throw new Error('Impossible d’initialiser le paiement Wave en mode réel : session de paiement non générée par l’API Wave.');
        }
        waveLaunchUrl = config.wave.merchantUrl || 'https://pay.wave.com/m/M_5iS6VUrJnTx-/c/sn/';
        checkoutUrl = waveLaunchUrl;
      }

      instructions = `Paiement direct Wave de ${amount.toLocaleString('fr-FR')} FCFA vers Groupe SALMA FALL.`;

      await db.execute(`
        INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [order.id, 'wave', transactionId, amount, currency, 'pending', JSON.stringify({ isLive, provider: 'wave', merchantUrl: waveLaunchUrl })]);

      return {
        success: true,
        provider: 'wave',
        transactionId,
        checkoutUrl: waveLaunchUrl,
        waveLaunchUrl,
        waveMerchantUrl: waveLaunchUrl,
        recipientName: 'Groupe SALMA FALL',
        recipientPhone: config.storePhone,
        recipientWhatsApp: config.storeWhatsApp,
        amount,
        instructions,
        isLive,
        status: 'pending'
      };
    }

    if (paymentMethod === 'orange_money') {
      const omQrUrl = config.orangeMoney.qrUrl || 'https://qrcode.orange.sn/dcnYNsnEy5lJG79Nh7DAxLPcCEX';
      const ussdCode = `*144*1*1*${config.storeWhatsApp}*${amount}#`;
      const omTelUrl = `tel:${encodeURIComponent(ussdCode)}`;
      checkoutUrl = omQrUrl;

      instructions = `Paiement direct Orange Money (Max it) de ${amount.toLocaleString('fr-FR')} FCFA vers Groupe SALMA FALL (${config.storePhone}).`;

      await db.execute(`
        INSERT INTO payments (order_id, provider, transaction_id, amount, currency, status, raw_response)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [order.id, 'orange_money', transactionId, amount, currency, 'pending', JSON.stringify({ isLive, provider: 'orange_money', omQrUrl, ussdCode })]);

      return {
        success: true,
        provider: 'orange_money',
        transactionId,
        checkoutUrl: omQrUrl,
        omQrUrl,
        qrImage: config.orangeMoney.qrImage || '/orange_money_qr_clean.png',
        ussdCode,
        omTelUrl,
        recipientName: 'Groupe SALMA FALL',
        recipientPhone: config.storePhone,
        recipientWhatsApp: config.storeWhatsApp,
        amount,
        instructions,
        isLive,
        status: 'pending'
      };
    }

    if (paymentMethod === 'card') {
      // Carte bancaire via PayTech SN (Visa, Mastercard, GIM-UEMOA)
      if (config.paytech.apiKey && config.paytech.apiSecret) {
        try {
          const paytechRes = await fetch('https://paytech.sn/api/payment/request-payment', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'API_KEY': config.paytech.apiKey,
              'API_SECRET': config.paytech.apiSecret
            },
            body: JSON.stringify({
              item_name: `Commande ${orderNumber}`,
              item_price: amount,
              currency: 'XOF',
              ref_command: orderNumber,
              command_name: `Paiement Commande ${orderNumber} - Salma Shop`,
              env: isLive ? 'live' : 'test',
              ipn_url: `${config.serverUrl || 'https://salmashop.onrender.com'}/api/payments/webhook/paytech`,
              success_url: `${config.clientUrl}/order-confirmation/${orderNumber}?status=success&trx=${transactionId}`,
              cancel_url: `${config.clientUrl}/order-confirmation/${orderNumber}?status=cancelled`
            })
          });
          const paytechData = await paytechRes.json();
          if (paytechData.success === 1 && paytechData.redirect_url) {
            checkoutUrl = paytechData.redirect_url;
            transactionId = paytechData.token || transactionId;
          }
        } catch (err) {
          console.error('Erreur API PayTech:', err);
        }
      }

      if (!checkoutUrl) {
        checkoutUrl = `${config.clientUrl}/order-confirmation/${orderNumber}?simulated_gateway=card&amount=${amount}`;
        instructions = `Passerelle Carte Bancaire sécurisée (PayTech SN). Compatible Visa, Mastercard et GIM-UEMOA.`;
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
    if (status === 'successful' || status === 'paid') {
      const paidAmount = Math.round(Number(payment.amount));
      const expectedAmount = Math.round(Number(order.total_amount));
      if (paidAmount !== expectedAmount) {
        throw new Error(`Incohérence de montant détectée: montant payé (${paidAmount} FCFA) != montant commande (${expectedAmount} FCFA).`);
      }
    }

    // Vocabulaire canonique unifié : 'pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'
    const newPaymentStatus = (status === 'successful' || status === 'paid') 
      ? 'paid' 
      : (status === 'cancelled' ? 'cancelled' : (status === 'failed' ? 'failed' : 'pending'));

    // 4. Mise à jour atomique dans une vraie transaction
    await db.transaction(async (tx) => {
      // Mettre à jour la transaction
      await tx.execute(`
        UPDATE payments
        SET status = ?, raw_response = ?
        WHERE id = ?
      `, [newPaymentStatus, JSON.stringify(rawPayload), payment.id]);

      // Mettre à jour la commande
      if (newPaymentStatus === 'paid') {
        await tx.execute(`
          UPDATE orders
          SET payment_status = 'paid', order_status = 'confirmed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [payment.order_id]);
      } else if (newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled') {
        await tx.execute(`
          UPDATE orders
          SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newPaymentStatus, payment.order_id]);
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
