import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, Mail, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const OrderSuccessPage = () => {
  const { orderID } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="container" style={{ padding: '60px 24px 100px', maxWidth: '720px' }}>
      <div
        className="card"
        style={{
          padding: '48px 36px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)'
          }}
        >
          <CheckCircle2 size={48} />
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Thank You! Your Order is Confirmed
        </h1>

        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '28px' }}>
          We've received your order and dispatched an email confirmation with your digital receipt.
        </p>

        {/* Order ID Badge Box */}
        <div
          style={{
            background: '#f8fafc',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>
            YOUR UNIQUE ORDER TRACKING ID
          </span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '1px' }}>
            {orderID}
          </span>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
            Save this Order ID to track delivery status without needing an account.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/tracking?orderID=${orderID}`} className="btn btn-primary btn-lg">
            <Package size={18} /> Track Delivery Status <ArrowRight size={16} />
          </Link>

          <Link to="/catalogue" className="btn btn-outline btn-lg">
            <Home size={18} /> Continue Shopping
          </Link>
        </div>

        <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '12px', color: 'var(--text-light)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--text-muted)' }} />
          Secure checkout
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
