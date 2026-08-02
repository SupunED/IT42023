import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

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
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
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
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag style={{ color: '#4f46e5' }} size={22} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Your Shopping Cart</h2>
            <span className="badge badge-primary">{cart.length} items</span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
            <span>
              {progressToFreeShipping >= 100
                ? '🎉 You unlocked FREE standard delivery!'
                : `Add $${remainingForFreeShipping.toFixed(2)} more for FREE delivery`}
            </span>
            <span>{Math.round(progressToFreeShipping)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressToFreeShipping}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4f46e5, #10b981)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                <ShoppingBag size={32} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Your cart is empty</h3>
              <p style={{ fontSize: '13px', marginBottom: 20 }}>Discover our curated collection of books and bestsellers.</p>
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
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <img
                      src={book.coverPhotoUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'}
                      alt={book.title}
                      style={{ width: '64px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                          {book.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 8px' }}>
                        {book.author}
                      </p>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                          <button
                            onClick={() => updateQuantity(id, item.quantity - 1)}
                            style={{ background: '#f8fafc', border: 'none', padding: '4px 8px', cursor: 'pointer', display: 'flex' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(id, item.quantity + 1)}
                            style={{ background: '#f8fafc', border: 'none', padding: '4px 8px', cursor: 'pointer', display: 'flex' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#4f46e5' }}>
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
          <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '14px', color: '#64748b' }}>
              <span>Subtotal:</span>
              <strong style={{ color: '#0f172a' }}>${subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '14px', color: '#64748b' }}>
              <span>Estimated Shipping:</span>
              <strong style={{ color: subtotal >= freeShippingThreshold ? '#10b981' : '#0f172a' }}>
                {subtotal >= freeShippingThreshold ? 'FREE' : '$4.99'}
              </strong>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: 12 }}
            >
              Checkout (${(subtotal + (subtotal >= freeShippingThreshold ? 0 : 4.99)).toFixed(2)}) <ArrowRight size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '11px', color: '#64748b' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} /> Encrypted Checkout & 100% Satisfaction Guarantee
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
