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
  const [cartNotification, setCartNotification] = useState(null);

  // Sauvegarder dans le localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('salma_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Erreur sauvegarde panier localStorage:', e);
    }
  }, [cartItems]);

  // Synchroniser le panier avec les prix et stocks réels de l'API
  const syncCart = async () => {
    if (!cartItems || cartItems.length === 0) {
      return { success: true, hasChanges: false, items: [] };
    }

    try {
      const res = await fetch('/api/products/verify-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems })
      });
      const data = await res.json();

      if (data.success && data.hasChanges) {
        let itemsRemoved = false;
        let priceUpdated = false;
        let stockAdjusted = false;

        const updatedCart = [];

        for (const item of data.items) {
          if (!item.isAvailable || item.quantity <= 0) {
            itemsRemoved = true;
            continue;
          }
          if (item.priceChanged) priceUpdated = true;
          if (item.stockChanged) stockAdjusted = true;

          updatedCart.push({
            id: item.id,
            name: item.name,
            slug: item.slug,
            price: item.price,
            compare_price: item.compare_price,
            image: item.image,
            stock: item.stock,
            sku: item.sku,
            quantity: item.quantity
          });
        }

        setCartItems(updatedCart);

        let noticeMsg = '';
        if (itemsRemoved) noticeMsg = 'Certains articles indisponibles ont été retirés de votre panier.';
        else if (priceUpdated || stockAdjusted) noticeMsg = 'Votre panier a été synchronisé avec les prix et stocks en direct.';

        if (noticeMsg) {
          setCartNotification(noticeMsg);
        }

        return {
          success: true,
          hasChanges: true,
          priceUpdated,
          stockAdjusted,
          itemsRemoved,
          items: updatedCart
        };
      }

      return { success: true, hasChanges: false, items: cartItems };
    } catch (err) {
      console.error('Erreur synchronisation panier:', err);
      return { success: false, error: err };
    }
  };

  // Synchronisation automatique au premier chargement si le panier n'est pas vide
  useEffect(() => {
    if (cartItems.length > 0) {
      syncCart();
    }
  }, []);

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

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('salma_cart');
    localStorage.removeItem('teranga_cart');
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    syncCart();
  };

  const closeDrawer = () => setIsDrawerOpen(false);
  const clearCartNotification = () => setCartNotification(null);

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
      clearCart,
      syncCart,
      cartNotification,
      clearCartNotification,
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
