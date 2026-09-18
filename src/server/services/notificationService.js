import { config } from '../config.js';

export const notificationService = {
  /**
   * Génère le texte WhatsApp pour une nouvelle commande
   */
  generateOrderWhatsAppMessage(order, items = []) {
    let itemsText = items.map(i => `• ${i.product_name || i.name || 'Article'} (x${i.quantity}) : ${(i.subtotal).toLocaleString('fr-FR')} FCFA`).join('\n');
    
    let paymentText = order.payment_method ? order.payment_method.toUpperCase() : 'WAVE';
    if (order.payment_method === 'wave') {
      paymentText = `🌊 WAVE (Transfert vers ${config.storePhone || '78 340 48 39'} / 77 201 86 97)`;
    } else if (order.payment_method === 'orange_money') {
      paymentText = `🟠 ORANGE MONEY (Transfert vers ${config.storePhone || '78 340 48 39'} / 77 201 86 97)`;
    } else if (order.payment_method === 'cash_on_delivery') {
      paymentText = '💵 PAIEMENT EN ESPÈCES À LA LIVRAISON';
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
