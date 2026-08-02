import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  CheckCircle2,
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
    switch (iconName) {
      case 'Cpu': return <Cpu size={22} style={{ color: '#6366f1' }} />;
      case 'Sparkles': return <Sparkles size={22} style={{ color: '#ec4899' }} />;
      case 'TrendingUp': return <TrendingUp size={22} style={{ color: '#10b981' }} />;
      case 'Brain': return <Brain size={22} style={{ color: '#f59e0b' }} />;
      case 'GraduationCap': return <GraduationCap size={22} style={{ color: '#3b82f6' }} />;
      default: return <BookOpen size={22} style={{ color: '#4f46e5' }} />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* 1. Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
          color: '#ffffff',
          padding: '80px 0 90px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Glows */}
        <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.25)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 600, color: '#fbcfe8', marginBottom: '24px' }}>
              <Sparkles size={16} style={{ color: '#f472b6' }} /> The Unified Digital Bookstore & Lending Hub
            </div>

            <h1 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.15, color: '#ffffff', marginBottom: '20px', letterSpacing: '-1px' }}>
              Discover, Read, Buy & <span style={{ background: 'linear-gradient(90deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Borrow Books</span> Seamlessly
            </h1>

            <p style={{ fontSize: '18px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '36px', maxWidth: '640px', margin: '0 auto 36px' }}>
              Explore thousands of bestselling titles across software engineering, fiction, science, and business. Purchase to keep or lend for flexible 14 to 30-day periods.
            </p>

            {/* Hero Search Box */}
            <form
              onSubmit={handleHeroSearch}
              style={{
                background: '#ffffff',
                padding: '8px',
                borderRadius: '50px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                maxWidth: '560px',
                margin: '0 auto 32px'
              }}
            >
              <input
                type="text"
                placeholder="Search by title, author, or topic (e.g., Clean Code, Dune)..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '12px 20px',
                  fontSize: '15px',
                  borderRadius: '30px',
                  color: '#0f172a'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '30px', padding: '12px 24px' }}>
                Search <ArrowRight size={16} />
              </button>
            </form>

            {/* Value Props Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', fontSize: '13px', color: '#94a3b8' }}>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Flexible Book Lending</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Real-Time Order Tracking</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Google OAuth 2.0 Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Features Bar */}
      <section style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '24px 0' }}>
        <div className="container">
          <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-6">
            <div className="flex items-center gap-4">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                <Truck size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Express Delivery</h4>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Free shipping on all orders over $50</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Clock size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Book Lending Library</h4>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Borrow books for 14 to 30 days easily</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <RotateCcw size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Easy Returns</h4>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Hassle-free return and lending drop-off</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Azure WAF Protected</h4>
                <p style={{ fontSize: '12px', color: '#64748b' }}>OWASP-compliant secure transactions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Browse Categories */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#4f46e5', letterSpacing: '1px' }}>EXPLORE BY GENRE</span>
              <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Popular Book Categories</h2>
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
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'all 0.25s ease'
                }}
                className="card"
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(cat.icon)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{cat.name}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>{cat.description}</p>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                    {cat.bookCount || 0} Titles Available →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Bestsellers */}
      <section style={{ padding: '40px 0 80px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '1px' }}>CURATED SELECTION</span>
              <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Featured Bestsellers & Top Picks</h2>
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
      <section style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#ffffff', padding: '70px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#f472b6', letterSpacing: '1px' }}>SMART BORROWING</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>How Book Lending Works</h2>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginTop: '8px' }}>
              Want to read without committing to buying? Rent books directly to your doorstep in 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-3 md-grid-cols-1 gap-8">
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '20px', fontWeight: 800 }}>
                1
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Choose Duration</h3>
              <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
                Select your book and pick a flexible rental period (14, 21, or 30 days). Review the small rental fee and submit your request.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '20px', fontWeight: 800 }}>
                2
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Instant Approval</h3>
              <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
                The library admin reviews and approves your request. You'll receive an automated confirmation email with your calculated due date.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '20px', fontWeight: 800 }}>
                3
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Read & Return</h3>
              <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
                Enjoy your reading! Track due dates from your profile dashboard and initiate returns in a single click when finished.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
