import { config } from '../config.js';

export const notificationService = {
  /**
   * Génère le texte WhatsApp pour une nouvelle commande
   */
  generateOrderWhatsAppMessage(order, items = []) {
    let itemsText = items.map(i => `• ${i.product_name} (x${i.quantity}) : ${(i.subtotal).toLocaleString('fr-FR')} FCFA`).join('\n');
    
    return `🛍️ *NOUVELLE COMMANDE - ${config.storeName}*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Numéro* : ${order.order_number}\n` +
      `👤 *Client* : ${order.customer_name}\n` +
      `📞 *Téléphone* : ${order.customer_phone}\n` +
      `📍 *Livraison* : ${order.delivery_city}, ${order.delivery_address}\n` +
      `💳 *Paiement* : ${order.payment_method.toUpperCase()} (${order.payment_status})\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *Articles commandés* :\n${itemsText}\n\n` +
      `🚚 *Frais de livraison* : ${(order.delivery_fee).toLocaleString('fr-FR')} FCFA\n` +
      `💰 *TOTAL À PAYER* : ${(order.total_amount).toLocaleString('fr-FR')} FCFA\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Merci pour votre confiance avec ${config.storeName} !`;
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
