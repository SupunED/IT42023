import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cart, subtotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 50.00;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26, 26, 26, 0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: '#ffffff',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag style={{ color: 'var(--text-main)' }} size={22} />
            <h2 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>Your Cart</h2>
            <span className="badge badge-neutral">{cart.length} items</span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ padding: '14px 24px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>
              {progressToFreeShipping >= 100
                ? 'Free standard delivery unlocked'
                : `Add $${remainingForFreeShipping.toFixed(2)} more for free delivery`}
            </span>
            <span>{Math.round(progressToFreeShipping)}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressToFreeShipping}%`,
                height: '100%',
                background: 'var(--primary)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-light)' }}>
                <ShoppingBag size={30} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>Your cart is empty</h3>
              <p style={{ fontSize: '13px', marginBottom: 20 }}>Browse the collection to get started.</p>
              <button
                onClick={() => { setIsCartOpen(false); navigate('/catalogue'); }}
                className="btn btn-outline btn-sm"
              >
                Browse Books
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.map((item) => {
                const book = item.book || {};
                const id = item.cartID || item.bookID;
                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      gap: 14,
                      paddingBottom: 16,
                      borderBottom: '1px solid var(--border-light)'
                    }}
                  >
                    <img
                      src={book.coverPhotoUrl || FALLBACK_BOOK_COVER}
                      alt={book.title}
                      onError={handleCoverError}
                      style={{ width: '64px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                          {book.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: 2 }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 8px' }}>
                        {book.author}
                      </p>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                          <button
                            onClick={() => updateQuantity(id, item.quantity - 1)}
                            style={{ background: 'var(--bg-main)', border: 'none', padding: '4px 8px', cursor: 'pointer', display: 'flex' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(id, item.quantity + 1)}
                            style={{ background: 'var(--bg-main)', border: 'none', padding: '4px 8px', cursor: 'pointer', display: 'flex' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                          ${(Number(book.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '14px', color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <strong style={{ color: 'var(--text-main)' }}>${subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '14px', color: 'var(--text-muted)' }}>
              <span>Shipping</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {subtotal >= freeShippingThreshold ? 'Free' : '$4.99'}
              </strong>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              Checkout (${(subtotal + (subtotal >= freeShippingThreshold ? 0 : 4.99)).toFixed(2)}) <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
