import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, RotateCcw, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import BookCard from '../../components/common/BookCard';

const CataloguePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters State
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const lendableParam = searchParams.get('lendable') === 'true';
  const inStockParam = searchParams.get('inStock') === 'true';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [searchQuery, setSearchQuery] = useState(qParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [lendableOnly, setLendableOnly] = useState(lendableParam);
  const [inStockOnly, setInStockOnly] = useState(inStockParam);
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [currentPage, setCurrentPage] = useState(pageParam);

  // Sync with searchParams
  useEffect(() => {
    setSearchQuery(qParam);
    setSelectedCategory(categoryParam);
    setLendableOnly(lendableParam);
    setInStockOnly(inStockParam);
    setSelectedSort(sortParam);
    setCurrentPage(pageParam);
  }, [qParam, categoryParam, lendableParam, inStockParam, sortParam, pageParam]);

  // Load Categories on mount
  useEffect(() => {
    api.get('/books/categories')
      .then(res => setCategories(res.data.categories || []))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Fetch Books whenever filters change
  useEffect(() => {
    const fetchFilteredBooks = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.set('q', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') queryParams.set('category', selectedCategory);
        if (lendableOnly) queryParams.set('lendable', 'true');
        if (inStockOnly) queryParams.set('inStock', 'true');
        if (maxPrice < 100) queryParams.set('maxPrice', maxPrice);
        if (selectedSort) queryParams.set('sort', selectedSort);
        queryParams.set('page', currentPage);
        queryParams.set('limit', '12');

        const { data } = await api.get(`/books?${queryParams.toString()}`);
        setBooks(data.books || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredBooks();
  }, [searchQuery, selectedCategory, lendableOnly, inStockOnly, maxPrice, selectedSort, currentPage]);

  const updateUrlFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 'all' || val === false) {
        params.delete(key);
      } else {
        params.set(key, val.toString());
      }
    });
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrlFilters({ q: searchQuery, page: 1 });
  };

  const handleCategoryChange = (catSlug) => {
    setSelectedCategory(catSlug);
    setCurrentPage(1);
    updateUrlFilters({ category: catSlug, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setLendableOnly(false);
    setInStockOnly(false);
    setMaxPrice(100);
    setSelectedSort('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Explore Book Catalogue
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px' }}>
          Showing {totalCount} books available for purchase and lending
        </p>
      </div>

      <div className="grid grid-cols-4 md-grid-cols-1 gap-8">
        {/* Left Sidebar: Filters */}
        <div style={{ gridColumn: 'span 1' }}>
          <div className="card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={18} style={{ color: '#4f46e5' }} /> Filters
              </h3>
              <button
                onClick={handleResetFilters}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '24px' }}>
              <label className="label">Categories</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('all')}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedCategory === 'all' ? '#eef2ff' : 'transparent',
                    color: selectedCategory === 'all' ? '#4f46e5' : '#334155',
                    fontWeight: selectedCategory === 'all' ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.catID}
                    onClick={() => handleCategoryChange(cat.slug)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedCategory === cat.slug ? '#eef2ff' : 'transparent',
                      color: selectedCategory === cat.slug ? '#4f46e5' : '#334155',
                      fontWeight: selectedCategory === cat.slug ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{cat.bookCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div style={{ marginBottom: '24px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <label className="label" style={{ margin: 0 }}>Max Price</label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>${maxPrice}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#4f46e5', cursor: 'pointer' }}
              />
            </div>

            {/* Availability Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setCurrentPage(1);
                    updateUrlFilters({ inStock: e.target.checked, page: 1 });
                  }}
                  style={{ accentColor: '#4f46e5', width: '16px', height: '16px' }}
                />
                In Stock Only
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={lendableOnly}
                  onChange={(e) => {
                    setLendableOnly(e.target.checked);
                    setCurrentPage(1);
                    updateUrlFilters({ lendable: e.target.checked, page: 1 });
                  }}
                  style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }}
                />
                Available for Lending
              </label>
            </div>
          </div>
        </div>

        {/* Right Section: Book Grid & Sort */}
        <div style={{ gridColumn: 'span 3' }}>
          {/* Search & Sort Controls Bar */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Filter by title, author, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '38px', height: '42px', fontSize: '13px' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </form>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Sort by:</span>
                <select
                  value={selectedSort}
                  onChange={(e) => {
                    setSelectedSort(e.target.value);
                    updateUrlFilters({ sort: e.target.value });
                  }}
                  className="input"
                  style={{ width: 'auto', padding: '8px 14px', height: '42px', fontSize: '13px', cursor: 'pointer' }}
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="rating">Top Customer Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="title_asc">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Books List Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <p>Loading book catalogue...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
              <BookOpen size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                No books match your criteria
              </h3>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                Try adjusting your search terms, expanding your price range, or resetting filters.
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary btn-sm">
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 lg-grid-cols-2 md-grid-cols-1 gap-6">
                {books.map((book) => (
                  <BookCard key={book.bookID} book={book} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '40px' }}>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          updateUrlFilters({ page: pageNum });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: currentPage === pageNum ? '#4f46e5' : '#ffffff',
                          color: currentPage === pageNum ? '#ffffff' : '#0f172a',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CataloguePage;
