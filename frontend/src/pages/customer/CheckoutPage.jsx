import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, CreditCard, Lock, ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';
import { loadPayHere, PENDING_PAYMENT_KEY, readPendingPayment } from '../../services/payhere';

const CheckoutPage = () => {
  const { cart, subtotal, clearPurchasedItems, loading: cartLoading } = useCart();
  const { user, initializing } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address || '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Sri Lanka',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingPayment, setPendingPayment] = useState(readPendingPayment);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [reviewRequired, setReviewRequired] = useState(false);
  const [pollVersion, setPollVersion] = useState(0);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (window.payhere) {
        window.payhere.onCompleted = () => {};
        window.payhere.onDismissed = () => {};
        window.payhere.onError = () => {};
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingPayment || initializing) return;
    let active = true;
    let timer;
    let attempts = 0;
    const checkStatus = async () => {
      attempts++;
      try {
        const { data } = await api.post('/orders/payment-status', {
          orderID: pendingPayment.orderID, paymentToken: pendingPayment.paymentToken
        }, { timeout: 10000 });
        if (!active) return;
        if (data.paymentStatus === 'paid') {
          if (data.reviewRequired) {
            setReviewRequired(true);
            setPaymentMessage('Payment received after the stock reservation ended. Contact BookNest with this order ID for fulfillment or a refund. Do not pay again.');
            return;
          }
          if ((pendingPayment.userID || null) === (user?.userID || null)) {
            await clearPurchasedItems(pendingPayment.items || []);
          }
          if (!active) return;
          sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          navigate(`/order-success/${data.orderID}`, { replace: true, state: { order: data } });
          return;
        }
        if (data.paymentStatus === 'failed' || data.paymentStatus === 'refunded') {
          sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          setPendingPayment(null);
          setErrorMsg('Payment failed, was cancelled, or expired. Your cart has been kept; you can try again.');
          setPaymentMessage('');
          return;
        }
        setPaymentMessage('Awaiting payment confirmation. Your books are reserved for 30 minutes from checkout.');
      } catch {
        if (!active) return;
        setPaymentMessage('Unable to confirm payment yet. Do not pay again while the result is unknown.');
      }
      if (attempts < 60) timer = setTimeout(checkStatus, 3000);
      else setPaymentMessage('Payment is still unconfirmed. Check again before making another payment.');
    };
    checkStatus();
    return () => { active = false; clearTimeout(timer); };
  }, [pendingPayment?.orderID, pollVersion, user?.userID, initializing]);

  const cancelCheckout = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await api.post('/orders/payment-cancel', {
        orderID: pendingPayment.orderID, paymentToken: pendingPayment.paymentToken
      });
      setPollVersion(version => version + 1);
    } catch (error) {
      setPaymentMessage(error.response?.data?.message || 'Cancellation could not be confirmed. Check payment status before trying again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

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

  if (pendingPayment) {
    return (
      <div className="container" style={{ padding: '48px 24px', maxWidth: 720 }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>{reviewRequired ? 'Payment needs review' : 'Payment in progress'}</h1>
        <p style={{ overflowWrap: 'anywhere', marginBottom: 12 }}>Order {pendingPayment.orderID}</p>
        <p role="status" style={{ marginBottom: 24 }}>{paymentMessage || 'Checking payment status...'}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!reviewRequired && <button type="button" className="btn btn-primary" onClick={() => setPollVersion(version => version + 1)}><RefreshCw size={18} /> Check Payment Status</button>}
          {!reviewRequired && <button type="button" className="btn btn-outline" disabled={submitting} onClick={cancelCheckout}><X size={18} /> {submitting ? 'Cancelling...' : 'Cancel Checkout'}</button>}
          <Link className="btn btn-outline" to="/catalogue" onClick={() => {
            if (reviewRequired) sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          }}>Back to Catalogue</Link>
        </div>
      </div>
    );
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
    if (submittingRef.current) return;
    if (!formData.street || !formData.city || !formData.zipCode) {
      setErrorMsg('Please enter your complete delivery address.');
      return;
    }

    if (!formData.email) {
      setErrorMsg('Please provide a valid email address for order notifications.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const sdk = await loadPayHere();
      const fullDeliveryAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`;
      const payload = {
        guestName: formData.name,
        guestEmail: formData.email,
        guestPhone: formData.phone,
        deliveryAddress: fullDeliveryAddress,
        city: formData.city,
        country: formData.country,
        notes: formData.notes,
        items: cart.map(item => ({
          bookID: item.bookID,
          quantity: item.quantity
        }))
      };

      const { data } = await api.post('/orders/checkout', payload);
      const pending = { orderID: data.orderID, paymentToken: data.paymentToken, items: payload.items, userID: user?.userID || null };
      if (mountedRef.current) setPendingPayment(pending);
      sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending));
      if (!mountedRef.current) return;
      sdk.onCompleted = () => {
        setPaymentMessage('Verifying payment with BookNest...');
        setPollVersion(version => version + 1);
      };
      sdk.onDismissed = () => {
        setPaymentMessage('Payment window closed. Checking for a final payment result...');
        setPollVersion(version => version + 1);
      };
      sdk.onError = () => {
        setPaymentMessage('PayHere could not complete checkout. Checking the payment status before allowing another attempt.');
        setPollVersion(version => version + 1);
      };
      sdk.startPayment({ ...data.payment, return_url: undefined, cancel_url: undefined });
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to open checkout. Check payment status before retrying.';
      setErrorMsg(message);
      setPaymentMessage(message);
    } finally {
      submittingRef.current = false;
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
        <div className="checkout-layout">
          {/* Left 2 Columns: Forms */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                    required
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
                  <label className="label">State / Province (Optional)</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
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
              <div style={{ marginTop: 16 }}>
                <label className="label" htmlFor="checkout-country">Country</label>
                <input id="checkout-country" className="input" name="country" value={formData.country} onChange={handleChange} required maxLength={100} />
              </div>
            </div>

            <div className="card" style={{ padding: '28px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '18px', flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <CreditCard size={20} style={{ color: 'var(--text-main)' }} /> 2. Payment Method
                </h3>
                <span className="badge badge-success flex items-center gap-1">
                  <Lock size={12} /> Sandbox
                </span>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
                <strong>PayHere</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Visa / Mastercard &middot; USD</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Test payments only. No real money is charged.</p>
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
          <div style={{ minWidth: 0 }}>
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
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Total (USD)</span>
                  <strong style={{ color: 'var(--text-main)' }}>${grandTotal}</strong>
                </div>
              </div>

              {errorMsg && (
                <p role="alert" style={{ color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                <CreditCard size={18} /> {submitting ? 'Opening PayHere...' : `Pay USD ${grandTotal}`}
              </button>

              <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                Confirmation is sent after payment verification.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
