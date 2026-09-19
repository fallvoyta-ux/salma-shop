import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('salma_cart') || localStorage.getItem('teranga_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sauvegarder dans le localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('salma_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Erreur sauvegarde panier localStorage:', e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const availableStock = product.stock !== undefined ? product.stock : 999;
        const newQty = Math.min(availableStock, currentQty + qty);

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
        };
        return updated;
      } else {
        const availableStock = product.stock !== undefined ? product.stock : 999;
        const newQty = Math.min(availableStock, qty);

        return [...prev, {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compare_price: product.compare_price,
          image: product.primary_image || (product.images && product.images[0] ? product.images[0].image_url : null),
          stock: product.stock,
          sku: product.sku,
          quantity: newQty
        }];
      }
    });

    setIsDrawerOpen(true);
  };

  const updateQuantity = (productId, quantity) => {
    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.id === productId) {
        const maxStock = item.stock !== undefined ? item.stock : 999;
        return {
          ...item,
          quantity: Math.min(maxStock, qty)
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  // Aligne un article du panier sur les données réelles du serveur (prix, stock actuels).
  // Utilisé au moment du paiement pour éviter qu'un client valide une commande
  // sur un prix ou un stock obsolète resté en mémoire depuis un précédent passage.
  const syncCartItem = (productId, updates) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== productId) return item;
      const merged = { ...item, ...updates };
      if (updates.stock !== undefined) {
        merged.quantity = Math.max(1, Math.min(updates.stock, item.quantity));
      }
      return merged;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('salma_cart');
    localStorage.removeItem('teranga_cart');
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  // Sous-total
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Nombre total d'articles
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      syncCartItem,
      clearCart,
      subtotal,
      totalCount,
      isDrawerOpen,
      openDrawer,
      closeDrawer
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé au sein d’un CartProvider');
  }
  return context;
}
