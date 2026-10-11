import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Package,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Calendar,
  ExternalLink,
  BookOpen,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatarUrl: user?.avatarUrl || ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Lendings State
  const [lendings, setLendings] = useState([]);
  const [loadingLendings, setLoadingLendings] = useState(false);
  const [returningId, setReturningId] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  // Fetch Orders
  useEffect(() => {
    if (activeTab === 'orders') {
      setLoadingOrders(true);
      api.get('/orders/my-orders')
        .then(res => setOrders(res.data.orders || []))
        .catch(err => console.error('Failed to load user orders:', err))
        .finally(() => setLoadingOrders(false));
    }
  }, [activeTab]);

  // Fetch Lendings
  useEffect(() => {
    if (activeTab === 'lendings') {
      fetchLendings();
    }
  }, [activeTab]);

  const fetchLendings = async () => {
    setLoadingLendings(true);
    try {
      const { data } = await api.get('/lending/my-lendings');
      setLendings(data.lendings || []);
    } catch (err) {
      console.error('Failed to load user lendings:', err);
    } finally {
      setLoadingLendings(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', profileData);
      updateUserProfile(data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReturnBook = async (lendID) => {
    if (!window.confirm('Are you ready to initiate return for this borrowed book?')) return;
    setReturningId(lendID);
    try {
      await api.post(`/lending/${lendID}/return`);
      await fetchLendings();
    } catch (err) {
      console.error('Failed to return book:', err);
    } finally {
      setReturningId(null);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Sign in to view your profile & library account</h2>
        <Link to="/sign-in" state={{ from: { pathname: '/profile' } }} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header band */}
      <div style={{ background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? <img
              src={user.avatarUrl}
              alt={user.name}
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffffff' }}
            /> : <UserIcon size={48} />}
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>{user.name}</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{user.email}</p>
              <span className="badge badge-primary" style={{ marginTop: '6px' }}>
                {user.role === 'admin' ? 'System Administrator' : 'BookNest Member'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSearchParams({ tab: 'profile' })}
              className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab !== 'profile' ? { background: '#ffffff' } : undefined}
            >
              <UserIcon size={14} /> Profile Settings
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'orders' })}
              className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab !== 'orders' ? { background: '#ffffff' } : undefined}
            >
              <Package size={14} /> My Orders
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'lendings' })}
              className={`btn btn-sm ${activeTab === 'lendings' ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab !== 'lendings' ? { background: '#ffffff' } : undefined}
            >
              <Clock size={14} /> Borrowed Books
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* TAB 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Personal Information</h3>

          {saveSuccess && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              ✅ Profile details updated successfully!
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Contact Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="input"
                placeholder="+1 (555) 234-5678"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Default Delivery Address</label>
              <textarea
                rows="3"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="input"
                placeholder="Street address, City, Postal Code..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="label">Profile Avatar Image URL</label>
              <input
                type="url"
                value={profileData.avatarUrl}
                onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                className="input"
              />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={16} /> {saving ? 'Saving changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: My Orders */}
      {activeTab === 'orders' && (
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Your Order History</h3>

          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
              <Package size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p>You haven't placed any book orders yet.</p>
              <Link to="/catalogue" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                Browse Catalogue
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map((ord) => (
                <div key={ord.orderID} className="card" style={{ padding: '24px' }}>
                  <div className="flex items-center justify-between flex-wrap gap-4" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Placed on {new Date(ord.createdAt).toLocaleDateString()}</span>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0 0 0' }}>{ord.orderID}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`badge ${ord.status === 'Delivered' ? 'badge-success' : ord.status === 'Cancelled' ? 'badge-danger' : 'badge-primary'}`}>{ord.status}</span>
                      {ord.delivery && <span className="badge badge-success" style={{ fontSize: '11px' }}><Truck size={12} /> {ord.delivery.status}</span>}
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>${Number(ord.total).toFixed(2)}</strong>
                      <Link to={`/tracking?orderID=${ord.orderID}`} className="btn btn-outline btn-sm">
                        <ExternalLink size={14} /> Track
                      </Link>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ord.items?.map((item) => (
                      <div key={item.itemID} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={item.book?.coverPhotoUrl || FALLBACK_BOOK_COVER}
                          alt={item.book?.title}
                          onError={handleCoverError}
                          style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.book?.title}</span>
                          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>${Number(item.totalPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: My Lendings */}
      {activeTab === 'lendings' && (
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Borrowed Books & Due Dates</h3>

          {loadingLendings ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading lending history...</div>
          ) : lendings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
              <Clock size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p>You have not borrowed any books yet.</p>
              <Link to="/catalogue?lendable=true" className="btn btn-outline btn-sm" style={{ marginTop: '12px' }}>
                Browse Lendable Books
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {lendings.map((lend) => {
                const isOverdue = lend.status === 'Overdue' || (lend.dueDate && new Date(lend.dueDate) < new Date() && lend.status === 'Active');
                return (
                  <div key={lend.lendID} className="card" style={{ padding: '24px', borderLeft: `4px solid ${isOverdue ? 'var(--danger)' : 'var(--primary)'}` }}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={lend.book?.coverPhotoUrl || FALLBACK_BOOK_COVER}
                          alt={lend.book?.title}
                          onError={handleCoverError}
                          style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0' }}>{lend.book?.title}</h4>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>by {lend.book?.author}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                            <span>Borrowed: {new Date(lend.startDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-main)', fontWeight: 700 }}>
                              Due: {lend.dueDate ? new Date(lend.dueDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`badge ${lend.status === 'Returned' ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-primary'}`}>
                          {lend.status}
                        </span>

                        {(lend.status === 'Active' || lend.status === 'Overdue') && (
                          <button
                            onClick={() => handleReturnBook(lend.lendID)}
                            disabled={returningId === lend.lendID}
                            className="btn btn-outline btn-sm"
                          >
                            <RotateCcw size={14} /> {returningId === lend.lendID ? 'Processing...' : 'Return Book'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};

export default ProfilePage;
