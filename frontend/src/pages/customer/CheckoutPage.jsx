import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';

const CheckoutPage = () => {
  const { cart, subtotal, clearCart, loading: cartLoading } = useCart();
  const { user, initializing } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address || '',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    paymentMethod: 'Credit Card (Stripe)',
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '888',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setFormData(current => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
      street: current.street || user.address || ''
    }));
  }, [user]);

  if (initializing || cartLoading) {
    return <div className="container" role="status" style={{ padding: '80px 24px' }}>Loading checkout...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Your cart is currently empty</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Add some books from our catalogue before checking out.</p>
        <Link to="/catalogue" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Explore Catalogue
        </Link>
      </div>
    );
  }

  const shippingFee = subtotal >= 50.00 ? 0.00 : 4.99;
  const grandTotal = (subtotal + shippingFee).toFixed(2);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!formData.street || !formData.city || !formData.zipCode) {
      setErrorMsg('Please enter your complete delivery address.');
      return;
    }

    if (!formData.email) {
      setErrorMsg('Please provide a valid email address for order notifications.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const fullDeliveryAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`;
      const payload = {
        guestName: formData.name,
        guestEmail: formData.email,
        guestPhone: formData.phone,
        deliveryAddress: fullDeliveryAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        items: cart.map(item => ({
          bookID: item.bookID,
          quantity: item.quantity
        }))
      };

      const { data } = await api.post('/orders/checkout', payload);
      clearCart();
      navigate(`/order-success/${data.orderID}`, { state: { order: data.order } });
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      <Link to="/catalogue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Continue Shopping
      </Link>

      <h1 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '32px' }}>Checkout & Place Order</h1>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-3 md-grid-cols-1 gap-8">
          {/* Left 2 Columns: Forms */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Step 1: Customer Contact & Delivery Details */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} style={{ color: 'var(--text-main)' }} /> 1. Delivery & Contact Details
              </h3>

              <div className="grid grid-cols-2 md-grid-cols-1 gap-4" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Email Address (for order receipts & tracking)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md-grid-cols-1 gap-4" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 019-2834"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="742 Evergreen Terrace, Apt 4"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 md-grid-cols-1 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Postal / ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Simulator */}
            <div className="card" style={{ padding: '28px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <CreditCard size={20} style={{ color: 'var(--text-main)' }} /> 2. Payment Method
                </h3>
                <span className="badge badge-success flex items-center gap-1">
                  <Lock size={12} /> 256-Bit SSL Encrypted
                </span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Direct Card Payment / Stripe</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>VISA</span>
                    <span style={{ background: '#eb001b', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>MC</span>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="label">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Expiration Date</label>
                    <input
                      type="text"
                      name="cardExp"
                      value={formData.cardExp}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">CVC / CVV</label>
                    <input
                      type="text"
                      name="cardCvc"
                      value={formData.cardCvc}
                      onChange={handleChange}
                      placeholder="123"
                      className="input"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Order Instructions / Delivery Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Please leave package at the front porch..."
                  className="input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div style={{ gridColumn: 'span 1' }}>
            <div className="card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                Order Summary
              </h3>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '20px', maxHeight: '260px', overflowY: 'auto' }}>
                {cart.map((item) => {
                  const book = item.book || {};
                  return (
                    <div key={item.cartID || item.bookID} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={book.coverPhotoUrl || FALLBACK_BOOK_COVER}
                        alt={book.title}
                        onError={handleCoverError}
                        style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{book.title}</h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Qty: {item.quantity} × ${Number(book.price || 0).toFixed(2)}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>
                        ${(Number(book.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Financial Calculation */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <strong style={{ color: '#0f172a' }}>${subtotal.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <strong style={{ color: shippingFee === 0 ? '#10b981' : '#0f172a' }}>
                    {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                  </strong>
                </div>
                <div className="flex justify-between" style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px', fontSize: '18px' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Amount</span>
                  <strong style={{ color: 'var(--text-main)' }}>${grandTotal}</strong>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                {submitting ? 'Processing Payment...' : `Confirm & Pay $${grandTotal}`}
              </button>

              <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                Instant confirmation & tracking ID will be sent to your email.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
