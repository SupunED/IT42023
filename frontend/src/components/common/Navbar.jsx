import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ShoppingBag,
  User as UserIcon,
  ShieldAlert,
  Package,
  Clock,
  LogOut,
  ChevronDown,
  Sparkles,
  Cloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, quickDemoLogin, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRoleSelect = async (role) => {
    setShowDemoMenu(false);
    await quickDemoLogin(role);
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
      {/* Top Banner with Azure Cloud Status */}
      <div style={{ background: 'linear-gradient(90deg, #1e1b4b, #312e81)', color: '#ffffff', padding: '6px 0', fontSize: '12px' }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '12px' }}>
              <Cloud size={13} style={{ color: '#38bdf8' }} /> Azure App Service + WAF Active
            </span>
            <span style={{ display: 'none' }} className="md-inline">|</span>
            <span style={{ opacity: 0.9 }}>Enjoy 100% Free Shipping on all orders over $50</span>
          </div>

          {/* Quick Evaluator Role Switcher */}
          <div className="flex items-center gap-2" style={{ position: 'relative' }}>
            <span style={{ opacity: 0.8 }}>Evaluator Switcher:</span>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Sparkles size={12} style={{ color: '#fbbf24' }} />
              {isAuthenticated ? `${user?.role?.toUpperCase()} (${user?.name?.split(' ')[0]})` : 'Guest Mode'}
              <ChevronDown size={12} />
            </button>

            {showDemoMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  padding: '8px',
                  width: '200px',
                  zIndex: 10001
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', padding: '4px 8px' }}>SWITCH TEST ROLE</div>
                <button
                  onClick={() => handleRoleSelect('customer')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', border: 'none', background: user?.role === 'customer' ? '#eef2ff' : 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <UserIcon size={14} /> Customer (Eleanor)
                </button>
                <button
                  onClick={() => handleRoleSelect('admin')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', border: 'none', background: user?.role === 'admin' ? '#fef3c7' : 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <ShieldAlert size={14} /> Admin Portal
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => { logout(); setShowDemoMenu(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <LogOut size={14} /> Log Out (Guest)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container" style={{ padding: '14px 24px' }}>
        <div className="flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Book<span style={{ color: '#4f46e5' }}>Nest</span>
              </span>
              <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 600 }}>
                Books & Lending
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by title, author, category, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '40px', paddingRight: '90px', borderRadius: '30px', background: '#f8fafc' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', borderRadius: '24px', padding: '6px 14px' }}
            >
              Search
            </button>
          </form>

          {/* Nav Links & Actions */}
          <div className="flex items-center gap-5">
            <Link
              to="/catalogue"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: location.pathname === '/catalogue' ? '#4f46e5' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Catalogue
            </Link>

            <Link
              to="/tracking"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: location.pathname === '/tracking' ? '#4f46e5' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Package size={16} /> Track Order
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="btn btn-sm"
                style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
              >
                <ShieldAlert size={14} /> Admin Dashboard
              </Link>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '9px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              <ShoppingBag size={20} style={{ color: '#4f46e5' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4f46e5' }}
                  />
                  <ChevronDown size={14} style={{ color: '#64748b' }} />
                </button>

                {showUserMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 8,
                      width: '220px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                      border: '1px solid #e2e8f0',
                      padding: '8px',
                      zIndex: 10002
                    }}
                  >
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{user?.name}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{user?.email}</p>
                      <span className={`badge ${isAdmin ? 'badge-accent' : 'badge-primary'}`} style={{ marginTop: 6 }}>
                        {isAdmin ? 'Library Admin' : 'BookNest Member'}
                      </span>
                    </div>

                    <div style={{ padding: '6px 0' }}>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', fontSize: '13px', color: '#334155', borderRadius: '6px' }}
                      >
                        <UserIcon size={15} /> My Profile & Lendings
                      </Link>

                      <Link
                        to="/profile?tab=orders"
                        onClick={() => setShowUserMenu(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', fontSize: '13px', color: '#334155', borderRadius: '6px' }}
                      >
                        <Package size={15} /> Order History
                      </Link>

                      <Link
                        to="/profile?tab=lendings"
                        onClick={() => setShowUserMenu(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', fontSize: '13px', color: '#334155', borderRadius: '6px' }}
                      >
                        <Clock size={15} /> Active Borrowed Books
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', fontSize: '13px', color: '#b45309', fontWeight: 600, borderRadius: '6px', background: '#fef3c7' }}
                        >
                          <ShieldAlert size={15} /> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', fontSize: '13px', color: '#ef4444', border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => quickDemoLogin('customer')}
                className="btn btn-outline btn-sm"
                style={{ gap: 6 }}
              >
                <UserIcon size={14} /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
