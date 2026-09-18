import { config } from '../config.js';

export const notificationService = {
  /**
   * Génère le texte WhatsApp pour une nouvelle commande
   */
  generateOrderWhatsAppMessage(order, items = []) {
    const isMobileMoney = order.payment_method === 'wave' || order.payment_method === 'orange_money';
    const itemsText = (items && items.length > 0)
      ? items.map(i => `• ${i.product_name || i.name || 'Article'} (x${i.quantity}) : ${(i.subtotal || 0).toLocaleString('fr-FR')} FCFA`).join('\n')
      : '• Commande Salma Shop';
    
    let paymentText = order.payment_method ? order.payment_method.toUpperCase() : 'WAVE';
    if (order.payment_method === 'wave') {
      paymentText = `🌊 WAVE (Transfert vers ${config.storePhone || '+221 77 201 86 97'})`;
    } else if (order.payment_method === 'orange_money') {
      paymentText = `🟠 ORANGE MONEY (Transfert vers ${config.storePhone || '+221 77 201 86 97'})`;
    } else if (order.payment_method === 'cash_on_delivery') {
      paymentText = '💵 PAIEMENT EN ESPÈCES À LA LIVRAISON';
    }

    if (isMobileMoney) {
      return `✅ *PAIEMENT ENVOYÉ AVEC SUCCÈS SUR WAVE (+221 77 201 86 97)*\n` +
        `🛍️ *COMMANDE - GLOBAL BUSINESS SERVICES GRP SF*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *N° Commande* : ${order.order_number}\n` +
        `💰 *MONTANT ENVOYÉ* : ${(order.total_amount || 0).toLocaleString('fr-FR')} FCFA\n` +
        `📱 *Bénéficiaire Wave* : Salma Shop (+221 77 201 86 97)\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Client* : ${order.customer_name || 'Client'}\n` +
        `📞 *Téléphone* : ${order.customer_phone || 'N/A'}\n` +
        `📍 *Livraison* : ${order.delivery_city || 'Dakar'}, ${order.delivery_address || ''}\n` +
        `💳 *Moyen sélectionné* : ${paymentText}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🛒 *Articles commandés* :\n${itemsText}\n\n` +
        `🚚 *Frais de livraison* : ${(order.delivery_fee || 0).toLocaleString('fr-FR')} FCFA\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Bonjour Salma Shop / Global Business Services Grp SF ! 👋\n` +
        `J'ai bien envoyé mon règlement de ${(order.total_amount || 0).toLocaleString('fr-FR')} FCFA sur votre compte Wave (+221 77 201 86 97) avec succès. ✅\n` +
        `Merci de me confirmer la bonne réception et de préparer ma livraison ! 💜🕊️🌹`;
    }

    return `🛍️ *COMMANDE - GLOBAL BUSINESS SERVICES GRP SF (${order.order_number})*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Client* : ${order.customer_name}\n` +
      `📞 *Téléphone* : ${order.customer_phone}\n` +
      `📍 *Livraison* : ${order.delivery_city}, ${order.delivery_address}\n` +
      `💳 *Mode de Règlement* : ${paymentText}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *Articles demandés* :\n${itemsText}\n\n` +
      `🚚 *Livraison* : ${(order.delivery_fee).toLocaleString('fr-FR')} FCFA\n` +
      `💰 *TOTAL À PAYER* : ${(order.total_amount).toLocaleString('fr-FR')} FCFA\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Bonjour Global Business Services Grp SF (Groupe Salma Fall) ! 👋 Je viens de valider cette commande sur votre boutique en ligne. La Qualité fait la Différence ! 💜🕊️🌹`;
  },

  /**
   * Génère le lien WhatsApp complet pour envoyer la commande
   */
  getOrderWhatsAppUrl(order, items = [], storePhone = null) {
    const phone = (storePhone || config.storeWhatsApp).replace(/[^0-9]/g, '');
    const message = this.generateOrderWhatsAppMessage(order, items);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Génère le lien WhatsApp pour commander directement un produit depuis sa fiche
   */
  getProductWhatsAppUrl(product, quantity = 1, storePhone = null) {
    const phone = (storePhone || config.storeWhatsApp).replace(/[^0-9]/g, '');
    const message = `Bonjour ${config.storeName} ! 👋\n\n` +
      `Je souhaite commander ce produit :\n` +
      `✨ *${product.name}*\n` +
      `🔖 *Réf* : ${product.sku || 'N/A'}\n` +
      `🔢 *Quantité* : ${quantity}\n` +
      `💵 *Prix unitaire* : ${(product.price).toLocaleString('fr-FR')} FCFA\n` +
      `💰 *Total estimé* : ${(product.price * quantity).toLocaleString('fr-FR')} FCFA\n\n` +
      `Est-il disponible pour une livraison à Dakar/Sénégal ? Merci !`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
};
