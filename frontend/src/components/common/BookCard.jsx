import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, BookOpen, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import StarRating from './StarRating';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';

const BookCard = ({ book }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (book.stock > 0) {
      addToCart(book, 1);
    }
  };

  const handleQuickLend = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/books/${book.bookID}?mode=lend`);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      className="card book-card"
    >
      {/* Cover Image Container */}
      <Link to={`/books/${book.bookID}`} style={{ position: 'relative', overflow: 'hidden', display: 'block', paddingTop: '135%', background: 'var(--bg-main)' }}>
        <img
          src={book.coverPhotoUrl || FALLBACK_BOOK_COVER}
          alt={book.title}
          onError={handleCoverError}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="book-cover-img"
        />

        {/* Badges on Top */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {book.category && (
            <span style={{ background: 'rgba(26, 26, 26, 0.8)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500 }}>
              {book.category.name}
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          {book.stock > 0 ? (
            <span style={{ background: 'rgba(255, 255, 255, 0.95)', color: 'var(--success)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Check size={12} /> {book.stock} in stock
            </span>
          ) : (
            <span style={{ background: 'rgba(255, 255, 255, 0.95)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={12} /> Out of stock
            </span>
          )}
        </div>
      </Link>

      {/* Book Information */}
      <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <StarRating rating={book.rating || 5} size={14} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({book.reviewCount || 0})</span>
        </div>

        <Link to={`/books/${book.bookID}`}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.35,
              color: 'var(--text-main)',
              marginBottom: 4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '42px'
            }}
            title={book.title}
          >
            {book.title}
          </h3>
        </Link>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 14 }}>
          by <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{book.author}</strong>
        </p>

        {/* Pricing & Lending Details */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Buy price</span>
              <span style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main)' }}>${Number(book.price).toFixed(2)}</span>
            </div>
            {book.lendableStock > 0 && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Rent from</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>${Number(book.lendingPricePerWeek || 2.99).toFixed(2)}/wk</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: book.lendableStock > 0 ? '1fr 1fr' : '1fr', gap: 8 }}>
            <button
              onClick={handleQuickAdd}
              disabled={book.stock <= 0}
              className="btn btn-primary btn-sm"
              style={{
                width: '100%',
                opacity: book.stock <= 0 ? 0.5 : 1,
                cursor: book.stock <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ShoppingBag size={14} /> Buy
            </button>

            {book.lendableStock > 0 && (
              <button
                onClick={handleQuickLend}
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
              >
                <BookOpen size={14} /> Lend
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
