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
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, initializing, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#ffffff', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
      {/* Main Navbar */}
      <div className="container" style={{ padding: '14px 24px' }}>
        <div className="flex items-center justify-between gap-6" style={{ flexWrap: 'wrap' }}>
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <span style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                BookNest
              </span>
              <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Books & Lending
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 240px', maxWidth: '480px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by title, author, category, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '40px', paddingRight: '90px', borderRadius: '8px', background: 'var(--bg-main)' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', borderRadius: '6px', padding: '6px 14px' }}
            >
              Search
            </button>
          </form>

          {/* Nav Links & Actions */}
          <div className="flex items-center" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <nav className="flex items-center" style={{ gap: '4px' }}>
              <Link
                to="/catalogue"
                style={{
                  fontSize: '14px',
                  fontWeight: location.pathname === '/catalogue' ? 600 : 500,
                  color: location.pathname === '/catalogue' ? 'var(--text-main)' : 'var(--text-muted)',
                  background: location.pathname === '/catalogue' ? 'var(--primary-light)' : 'transparent',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                Catalogue
              </Link>

              <Link
                to="/tracking"
                style={{
                  fontSize: '14px',
                  fontWeight: location.pathname === '/tracking' ? 600 : 500,
                  color: location.pathname === '/tracking' ? 'var(--text-main)' : 'var(--text-muted)',
                  background: location.pathname === '/tracking' ? 'var(--primary-light)' : 'transparent',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                <Package size={16} /> Track Order
              </Link>
            </nav>

            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

            {isAdmin && (
              <Link
                to="/admin"
                className="btn btn-outline btn-sm"
              >
                <ShieldAlert size={14} /> Admin Dashboard
              </Link>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '9px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              <ShoppingBag size={20} style={{ color: 'var(--text-main)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                  {user?.avatarUrl ? <img
                    src={user.avatarUrl}
                    alt={user?.name}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                  /> : <UserIcon size={28} aria-label={user?.name} />}
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
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
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--border)',
                      padding: '8px',
                      zIndex: 10002
                    }}
                  >
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>{user?.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflowWrap: 'anywhere' }}>{user?.email}</p>
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
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 600, borderRadius: '6px', background: 'var(--primary-light)' }}
                        >
                          <ShieldAlert size={15} /> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
                      <button
                        onClick={async () => {
                          const result = await logout();
                          if (result.success) {
                            setShowUserMenu(false);
                            navigate('/');
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', fontSize: '13px', color: 'var(--danger)', border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/sign-in', { state: { from: location } })}
                disabled={initializing}
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
