import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  BookOpen,
  Check,
  AlertCircle,
  Truck,
  ShieldCheck,
  Clock,
  Calendar,
  MessageSquare,
  Send,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/common/StarRating';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';

const BookDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated, initializing } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'lend' ? 'lend' : 'buy');

  // Purchase Form State
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Lending Form State
  const [durationDays, setDurationDays] = useState(14);
  const [lendingSubmitting, setLendingSubmitting] = useState(false);
  const [lendingSuccess, setLendingSuccess] = useState(false);
  const [lendingError, setLendingError] = useState('');

  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/books/${id}`);
        setBook(data.book);
      } catch (err) {
        console.error('Failed to load book details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleAddToCart = async () => {
    if (!book || book.stock < 1) return;
    setAddingToCart(true);
    await addToCart(book, quantity);
    setAddingToCart(false);
  };

  const handleLendingSubmit = async (e) => {
    e.preventDefault();
    if (initializing) return;
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { from: { pathname: `/books/${id}`, search: '?mode=lend' } } });
      return;
    }

    setLendingSubmitting(true);
    setLendingError('');
    try {
      await api.post('/lending/request', {
        bookID: book.bookID,
        durationDays: parseInt(durationDays)
      });
      setLendingSuccess(true);
      // Refresh book stock
      const { data } = await api.get(`/books/${id}`);
      setBook(data.book);
    } catch (err) {
      setLendingError(err.response?.data?.message || 'Failed to submit lending request');
    } finally {
      setLendingSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (initializing) return;
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { from: { pathname: `/books/${id}` } } });
      return;
    }

    if (!newComment.trim()) return;
    setReviewSubmitting(true);
    try {
      await api.post(`/books/${id}/reviews`, {
        rating: newRating,
        comment: newComment.trim()
      });
      setReviewSuccess(true);
      setNewComment('');
      // Reload book
      const { data } = await api.get(`/books/${id}`);
      setBook(data.book);
    } catch (err) {
      console.error('Failed to post review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <p>Loading book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Book not found</h2>
        <Link to="/catalogue" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Catalogue</Link>
      </div>
    );
  }

  const calculatedLendingFee = ((Math.ceil(durationDays / 7)) * Number(book.lendingPricePerWeek || 2.99)).toFixed(2);

  return (
    <div className="container" style={{ padding: '30px 24px 80px' }}>
      {/* Back button */}
      <Link to="/catalogue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Catalogue
      </Link>

      <div className="grid grid-cols-2 md-grid-cols-1 gap-8" style={{ alignItems: 'start', marginBottom: '60px' }}>
        {/* Left Column: Book Cover Presentation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '30px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
              position: 'relative'
            }}
          >
            <img
              src={book.coverPhotoUrl || FALLBACK_BOOK_COVER}
              alt={book.title}
              onError={handleCoverError}
              style={{
                maxWidth: '320px',
                width: '100%',
                maxHeight: '460px',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.18)',
                margin: '0 auto'
              }}
            />


          </div>

          {/* Quick Perks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Truck size={20} style={{ color: 'var(--text-main)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '12px' }}>Fast Delivery</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Ships in 24-48 hrs</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} style={{ color: 'var(--text-main)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '12px' }}>Authentic Copy</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Verified publisher</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Book Details & Actions */}
        <div>
          {book.category && (
            <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
              {book.category.name}
            </span>
          )}

          <h1 style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.25, color: 'var(--text-main)', marginBottom: '8px' }}>
            {book.title}
          </h1>

          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '16px' }}>
            Written by <strong style={{ color: '#1e293b' }}>{book.author}</strong> {book.isbn && `• ISBN: ${book.isbn}`}
          </p>

          {/* Rating Summary */}
          <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
            <StarRating rating={book.rating || 5} size={18} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{book.rating}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>({book.reviewCount} customer reviews)</span>
          </div>

          {/* Description */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', lineHeight: 1.6, color: '#334155', fontSize: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Overview</h4>
            {book.description || 'No description available.'}
          </div>

          {/* Mode Switcher: Buy vs. Lend */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '20px', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('buy')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'buy' ? '#ffffff' : 'transparent',
                  color: activeTab === 'buy' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'buy' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <ShoppingBag size={16} /> Buy (${Number(book.price).toFixed(2)})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lend')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'lend' ? '#ffffff' : 'transparent',
                  color: activeTab === 'lend' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'lend' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <BookOpen size={16} /> Lend (${Number(book.lendingPricePerWeek || 2.99).toFixed(2)}/wk)
              </button>
            </div>

            {/* TAB 1: BUY FLOW */}
            {activeTab === 'buy' && (
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Purchase Price</span>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>${Number(book.price).toFixed(2)}</span>
                  </div>
                  <div>
                    {book.stock > 0 ? (
                      <span className="badge badge-success"><Check size={12} /> {book.stock} copies available</span>
                    ) : (
                      <span className="badge badge-danger"><AlertCircle size={12} /> Currently Out of Stock</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ background: '#f8fafc', border: 'none', padding: '10px 14px', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ padding: '8px 16px', fontWeight: 700 }}>{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(book.stock, quantity + 1))}
                      style={{ background: '#f8fafc', border: 'none', padding: '10px 14px', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={book.stock <= 0 || addingToCart}
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1 }}
                  >
                    <ShoppingBag size={18} /> {addingToCart ? 'Adding...' : 'Add to Shopping Cart'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: LEND / BORROW FLOW */}
            {activeTab === 'lend' && (
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Calculated Lending Fee</span>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>${calculatedLendingFee}</span>
                  </div>
                  <div>
                    {book.lendableStock > 0 ? (
                      <span className="badge badge-accent"><BookOpen size={12} /> {book.lendableStock} lendable copies</span>
                    ) : (
                      <span className="badge badge-danger"><AlertCircle size={12} /> All copies currently lent</span>
                    )}
                  </div>
                </div>

                {lendingSuccess ? (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '8px', color: '#065f46', textAlign: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0' }}>✅ Lending Request Submitted!</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      Our library administration team will review and approve your {durationDays}-day rental shortly. You will receive an email confirmation.
                    </p>
                    <Link to="/profile?tab=lendings" className="btn btn-outline btn-sm" style={{ marginTop: '12px' }}>
                      View My Lendings
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleLendingSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label">Select Rental Duration</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {[14, 21, 30].map((days) => (
                          <button
                            type="button"
                            key={days}
                            onClick={() => setDurationDays(days)}
                            style={{
                              padding: '10px 8px',
                              borderRadius: '8px',
                              border: `1px solid ${durationDays === days ? 'var(--primary)' : 'var(--border)'}`,
                              background: durationDays === days ? 'var(--primary-light)' : '#ffffff',
                              color: durationDays === days ? 'var(--text-main)' : 'var(--text-muted)',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            {days} Days
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} /> Due Date: <strong>{new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
                      </div>
                      <p style={{ margin: 0 }}>Books must be returned by the due date to avoid automated overdue reminders.</p>
                    </div>

                    {lendingError && (
                      <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{lendingError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={book.lendableStock <= 0 || lendingSubmitting}
                      className="btn btn-accent btn-lg"
                      style={{ width: '100%' }}
                    >
                      <BookOpen size={18} /> {lendingSubmitting ? 'Submitting Request...' : `Borrow for ${durationDays} Days ($${calculatedLendingFee})`}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews & Feedback Section */}
      <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Customer Reviews & Ratings</h2>

        <div className="grid grid-cols-3 md-grid-cols-1 gap-8">
          {/* Left: Write a Review Form */}
          <div style={{ gridColumn: 'span 1' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Write a Customer Review</h3>

              {reviewSuccess ? (
                <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', color: '#065f46', fontSize: '13px' }}>
                  Thank you for reviewing this book! Your rating has been published.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ marginBottom: '14px' }}>
                    <label className="label">Your Rating</label>
                    <StarRating
                      rating={newRating}
                      interactive={true}
                      onRatingChange={(r) => setNewRating(r)}
                      size={24}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="label">Review Comments</label>
                    <textarea
                      rows="4"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about the plot, style, or quality..."
                      className="input"
                      style={{ resize: 'vertical' }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting || !newComment.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    <Send size={14} /> {reviewSubmitting ? 'Posting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right: Existing Reviews List */}
          <div style={{ gridColumn: 'span 2' }}>
            {(!book.reviews || book.reviews.length === 0) ? (
              <div className="card" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                <MessageSquare size={32} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
                <p>No reviews yet for this title. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {book.reviews.map((rev) => (
                  <div key={rev.reviewID} className="card" style={{ padding: '20px' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={rev.user?.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{rev.user?.name || 'Verified Reader'}</span>
                      </div>
                      <StarRating rating={rev.rating} size={14} />
                    </div>
                    <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{rev.comment}</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookDetailPage;
