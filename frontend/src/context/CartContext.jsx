import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user, initializing } = useAuth();
  const currentUserID = useRef(user?.userID);
  currentUserID.current = user?.userID;
  const pendingSync = useRef(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('booknest_guest_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync / Fetch Cart when user logs in or changes
  useEffect(() => {
    if (initializing) return;
    let active = true;
    setCart([]);
    if (isAuthenticated) {
      // Sync guest items if any exist
      const guestItems = JSON.parse(localStorage.getItem('booknest_guest_cart') || '[]');
      if (guestItems.length > 0) {
        if (!pendingSync.current || pendingSync.current.userID !== user.userID) {
          pendingSync.current = {
            userID: user.userID,
            promise: api.post('/cart/sync', { items: guestItems.map(item => ({ bookID: item.bookID, quantity: item.quantity })) })
          };
        }
        pendingSync.current.promise
          .then(() => {
            localStorage.removeItem('booknest_guest_cart');
          })
          .catch(error => console.error('Cart sync failed:', error))
          .finally(() => { if (active) fetchServerCart(); });
      } else {
        fetchServerCart();
      }
    } else {
      pendingSync.current = null;
      setCart(JSON.parse(localStorage.getItem('booknest_guest_cart') || '[]'));
      setLoading(false);
    }
    return () => { active = false; };
  }, [isAuthenticated, user?.userID, initializing]);

  const fetchServerCart = async () => {
    const requestedUserID = currentUserID.current;
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      const formatted = data.cart.map(item => ({
        cartID: item.cartID,
        bookID: item.bookID,
        quantity: item.quantity,
        book: item.book
      }));
      if (requestedUserID === currentUserID.current) setCart(formatted);
    } catch (err) {
      console.error('Failed to fetch server cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (book, quantity = 1) => {
    const qty = parseInt(quantity) || 1;

    if (isAuthenticated) {
      try {
        await api.post('/cart/add', { bookID: book.bookID, quantity: qty });
        await fetchServerCart();
        setIsCartOpen(true);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.response?.data?.message || err.message };
      }
    } else {
      // Guest Cart
      let updatedCart = [...cart];
      const existingIndex = updatedCart.findIndex(item => item.bookID === book.bookID);
      if (existingIndex > -1) {
        const newQty = updatedCart[existingIndex].quantity + qty;
        if (newQty > book.stock) {
          return { success: false, error: `Cannot exceed available stock (${book.stock})` };
        }
        updatedCart[existingIndex].quantity = newQty;
      } else {
        updatedCart.push({
          bookID: book.bookID,
          quantity: Math.min(qty, book.stock),
          book
        });
      }
      setCart(updatedCart);
      localStorage.setItem('booknest_guest_cart', JSON.stringify(updatedCart));
      setIsCartOpen(true);
      return { success: true };
    }
  };

  const updateQuantity = async (itemIdentifier, newQty) => {
    if (newQty <= 0) {
      return removeFromCart(itemIdentifier);
    }

    if (isAuthenticated) {
      try {
        await api.put(`/cart/items/${itemIdentifier}`, { quantity: newQty });
        await fetchServerCart();
      } catch (err) {
        console.error('Update qty error:', err);
      }
    } else {
      const updatedCart = cart.map(item => {
        if (item.bookID === itemIdentifier || item.cartID === itemIdentifier) {
          return { ...item, quantity: Math.min(newQty, item.book.stock) };
        }
        return item;
      });
      setCart(updatedCart);
      localStorage.setItem('booknest_guest_cart', JSON.stringify(updatedCart));
    }
  };

  const removeFromCart = async (itemIdentifier) => {
    if (isAuthenticated) {
      try {
        await api.delete(`/cart/items/${itemIdentifier}`);
        await fetchServerCart();
      } catch (err) {
        console.error('Remove cart item error:', err);
      }
    } else {
      const updatedCart = cart.filter(item => item.bookID !== itemIdentifier && item.cartID !== itemIdentifier);
      setCart(updatedCart);
      localStorage.setItem('booknest_guest_cart', JSON.stringify(updatedCart));
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('booknest_guest_cart');
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = cart.reduce((sum, item) => {
    const price = item.book ? Number(item.book.price) : 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
