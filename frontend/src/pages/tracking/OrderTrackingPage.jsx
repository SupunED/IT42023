import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  MapPin,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';

const ORDER_STAGES = ['Reviewing', 'Processing', 'Ready', 'In Progress', 'Delivered'];

const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderID = searchParams.get('orderID') || '';
  const initialEmail = searchParams.get('email') || '';

  const [orderID, setOrderID] = useState(initialOrderID);
  const [email, setEmail] = useState(initialEmail);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTracking = async (searchId, searchEmail) => {
    if (!searchId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await api.get(`/orders/track?orderID=${encodeURIComponent(searchId)}${searchEmail ? `&email=${encodeURIComponent(searchEmail)}` : ''}`);
      setOrder(data.order);
    } catch (err) {
      setOrder(null);
      setErrorMsg(err.response?.data?.message || 'Order not found. Please check your Order ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderID) {
      fetchTracking(initialOrderID, initialEmail);
    }
  }, [initialOrderID, initialEmail]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!orderID.trim()) return;
    setSearchParams({ orderID: orderID.trim(), email: email.trim() });
    fetchTracking(orderID.trim(), email.trim());
  };

  const getStageIndex = (currentStatus) => {
    const idx = ORDER_STAGES.indexOf(currentStatus);
    return idx >= 0 ? idx : 0;
  };

  return (
    <>
      {/* Page Header band */}
      <div style={{ background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '12px', background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={28} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Track Your Delivery
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '520px', margin: '0 auto' }}>
            Enter your Order ID below to view live delivery progression, courier notes, and parcel milestones.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: '960px' }}>
      {/* Search Box Card */}
      <div className="card" style={{ padding: '28px', marginBottom: '36px' }}>
        <form onSubmit={handleTrackSubmit}>
          <div className="grid grid-cols-3 md-grid-cols-1 gap-4 items-end">
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Order Tracking ID *</label>
              <input
                type="text"
                value={orderID}
                onChange={(e) => setOrderID(e.target.value)}
                placeholder="e.g. BN-2026-10492"
                className="input"
                style={{ fontSize: '15px', textTransform: 'uppercase' }}
                required
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', height: '44px' }}
              >
                <Search size={16} /> {loading ? 'Locating...' : 'Track Parcel'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="card" style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tracking Results Card */}
      {order && (
        <div className="card" style={{ padding: '32px', animation: 'fadeIn 0.3s ease-out' }}>
          {/* Top Bar with Status and Order ID */}
          <div className="flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '28px', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Tracking details for</span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0 0 0' }}>{order.orderID}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-primary" style={{ fontSize: '14px', padding: '6px 14px' }}>
                Current Status: {order.status}
              </span>
            </div>
          </div>

          {/* 5-Stage Stepper */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, position: 'relative' }}>
              {ORDER_STAGES.map((stage, index) => {
                const activeIndex = getStageIndex(order.status);
                const isPassed = index <= activeIndex;
                const isCurrent = index === activeIndex;

                return (
                  <div key={stage} style={{ textAlign: 'center', position: 'relative' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isPassed ? 'var(--primary)' : 'var(--border)',
                        color: isPassed ? '#ffffff' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        fontWeight: 700,
                        fontSize: '13px',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isPassed ? <CheckCircle2 size={18} /> : index + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isPassed ? '#0f172a' : '#94a3b8',
                        display: 'block'
                      }}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Details Card */}
          <div className="grid grid-cols-2 md-grid-cols-1 gap-6" style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Delivery Address</h4>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <MapPin size={16} style={{ color: 'var(--text-main)', marginTop: 2, flexShrink: 0 }} />
                {order.deliveryAddress}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Courier Information</h4>
              <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>
                <strong>Carrier:</strong> {order.delivery?.carrier || 'BookNest Express'}<br/>
                <strong>Tracking No:</strong> {order.delivery?.trackingNumber || 'Pending assignment'}<br/>
                {order.delivery?.notes && <span style={{ fontSize: '12px', color: '#64748b' }}>Latest update: {order.delivery.notes}</span>}
              </p>
            </div>
          </div>

          {/* Ordered Books Breakdown */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Items in this Shipment</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {order.items?.map((item) => (
                <div key={item.itemID} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <img
                    src={item.book?.coverPhotoUrl || FALLBACK_BOOK_COVER}
                    alt={item.book?.title}
                    onError={handleCoverError}
                    style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{item.book?.title}</h5>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>by {item.book?.author}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Qty: {item.quantity}</span>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-main)' }}>${Number(item.totalPrice).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default OrderTrackingPage;
