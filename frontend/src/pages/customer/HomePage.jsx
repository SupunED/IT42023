import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Truck,
  RotateCcw,
  Clock,
  TrendingUp,
  Cpu,
  Brain,
  GraduationCap
} from 'lucide-react';
import api from '../../services/api';
import BookCard from '../../components/common/BookCard';

const HomePage = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKey, setSearchKey] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [booksRes, catsRes] = await Promise.all([
          api.get('/books?featured=true&limit=8'),
          api.get('/books/categories')
        ]);
        setFeaturedBooks(booksRes.data.books || []);
        setCategories(catsRes.data.categories || []);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchKey.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(searchKey.trim())}`);
    }
  };

  const getCategoryIcon = (iconName) => {
    const color = 'var(--text-main)';
    switch (iconName) {
      case 'Cpu': return <Cpu size={22} style={{ color }} />;
      case 'Sparkles': return <Sparkles size={22} style={{ color }} />;
      case 'TrendingUp': return <TrendingUp size={22} style={{ color }} />;
      case 'Brain': return <Brain size={22} style={{ color }} />;
      case 'GraduationCap': return <GraduationCap size={22} style={{ color }} />;
      default: return <BookOpen size={22} style={{ color }} />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* 1. Hero Section */}
      <section
        style={{
          background: 'var(--primary-light)',
          borderBottom: '1px solid var(--border)',
          padding: '80px 0'
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-main)', marginBottom: '18px', letterSpacing: '-1px' }}>
              Buy and borrow books, simply.
            </h1>

            <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 32px' }}>
              Thousands of titles across technology, fiction, science and business. Purchase to keep, or borrow for 14 to 30 days.
            </p>

            {/* Hero Search Box */}
            <form
              onSubmit={handleHeroSearch}
              style={{
                background: '#ffffff',
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                maxWidth: '520px',
                margin: '0 auto'
              }}
            >
              <input
                type="text"
                placeholder="Search by title, author, or topic..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '10px 14px',
                  fontSize: '15px',
                  color: 'var(--text-main)',
                  background: 'transparent'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                Search <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Key Features Bar */}
      <section style={{ background: '#ffffff', borderBottom: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <div className="grid grid-cols-3 md-grid-cols-1" style={{ gap: 0 }}>
            {[
              { Icon: Truck, title: 'Free Delivery', text: 'On all orders over $50' },
              { Icon: Clock, title: 'Lending Library', text: 'Borrow books for 14 to 30 days' },
              { Icon: RotateCcw, title: 'Easy Returns', text: 'Simple returns and drop-off' }
            ].map(({ Icon, title, text }, i) => (
              <div
                key={title}
                className="flex items-center gap-4 feature-cell"
                style={{
                  padding: '4px 28px',
                  borderLeft: i === 0 ? 'none' : '1px solid var(--border)'
                }}
              >
                <div style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <Icon size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Browse Categories */}
      <section style={{ padding: '72px 0', background: 'var(--bg-main)' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.3px' }}>Browse Categories</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Find your next read by subject.</p>
            </div>
            <Link to="/catalogue" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-3 lg-grid-cols-2 md-grid-cols-1 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.catID}
                to={`/catalogue?category=${cat.slug}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'all 0.2s ease'
                }}
                className="card"
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(cat.icon)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{cat.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{cat.description}</p>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--accent)' }}>
                    {cat.bookCount || 0} titles →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Bestsellers */}
      <section style={{ padding: '72px 0', background: '#ffffff', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.3px' }}>Featured Books</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Hand-picked titles available to buy or borrow.</p>
            </div>
            <Link to="/catalogue" className="btn btn-primary btn-sm">
              Explore All Books <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>Loading books...</div>
          ) : (
            <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.bookID} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. How Book Lending Works Banner */}
      <section style={{ background: 'var(--primary-light)', borderTop: '1px solid var(--border)', padding: '72px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto 40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>How Lending Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px' }}>
              Borrow books in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-3 md-grid-cols-1 gap-6">
            {[
              { n: 1, title: 'Choose Duration', text: 'Pick a book and a rental period of 14, 21, or 30 days, then submit your request.' },
              { n: 2, title: 'Get Approved', text: 'An admin reviews your request and you receive a confirmation email with the due date.' },
              { n: 3, title: 'Read & Return', text: 'Track due dates from your profile and start a return in a single click.' }
            ].map((step) => (
              <div key={step.n} style={{ background: '#ffffff', borderRadius: '10px', padding: '26px', border: '1px solid var(--border)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
                  {step.n}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
