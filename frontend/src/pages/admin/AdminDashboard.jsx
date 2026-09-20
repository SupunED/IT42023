import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Package,
  Clock,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Truck,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Tags,
  Upload
} from 'lucide-react';
import api from '../../services/api';
import { FALLBACK_BOOK_COVER, handleCoverError } from '../../utils/images';

const CategoryCreateForm = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/admin/categories', { name: name.trim(), description });
      onCreated(data.category);
      setName('');
      setDescription('');
      setMessage(`Category "${data.category.name}" created.`);
    } catch (error) {
      setError(error.response?.data?.message || 'Could not create category. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Add category" style={{ marginBottom: 24 }}>
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 16 }}>
          <label className="label">Category name *
            <input className="input" value={name} onChange={event => setName(event.target.value)} maxLength={100} required />
          </label>
          <label className="label">Description
            <input className="input" value={description} onChange={event => setDescription(event.target.value)} maxLength={2000} />
          </label>
        </div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={saving || !name.trim()}>
          <Plus size={16} /> {saving ? 'Adding...' : 'Add Category'}
        </button>
      </fieldset>
      {error && <p role="alert" style={{ color: 'var(--danger)', marginTop: 12 }}>{error}</p>}
      {message && <p role="status" style={{ marginTop: 12 }}>{message}</p>}
    </form>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Books / Inventory State
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [categoryMessage, setCategoryMessage] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [replacementCategoryID, setReplacementCategoryID] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    categoryID: '',
    price: '',
    lendingPricePerWeek: '2.99',
    stock: '10',
    lendableStock: '5',
    description: '',
    coverPhotoUrl: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [submittingBook, setSubmittingBook] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Lendings State
  const [lendings, setLendings] = useState([]);
  const [loadingLendings, setLoadingLendings] = useState(false);

  // Email Composer State
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  // Load Dashboard Data
  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') fetchBooks();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'lendings') fetchLendings();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    setCategoryError('');
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.categories || []);
      setCategoryToDelete(current => current ? data.categories.find(category => category.catID === current.catID) || null : null);
    } catch (err) {
      setCategoryError('Failed to load categories. Please retry.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCategoryCreated = category => {
    setCategories(current => [...current, category].sort((first, second) => first.name.localeCompare(second.name)));
    setBookFormData(current => ({ ...current, categoryID: category.catID }));
    setCategoryMessage('');
  };

  const handleDeleteCategory = async event => {
    event.preventDefault();
    setDeletingCategory(true);
    setCategoryError('');
    setCategoryMessage('');
    try {
      const { data } = await api.delete(`/admin/categories/${categoryToDelete.catID}`, {
        data: { replacementCategoryID: replacementCategoryID || null }
      });
      setCategories(current => current.filter(category => category.catID !== categoryToDelete.catID));
      setBookFormData(current => String(current.categoryID) === String(categoryToDelete.catID)
        ? { ...current, categoryID: replacementCategoryID || '' } : current);
      setCategoryToDelete(null);
      setReplacementCategoryID('');
      setCategoryMessage(`Category deleted. ${data.movedBooks} book(s) reassigned.`);
      await fetchCategories();
      fetchBooks();
    } catch (error) {
      setCategoryError(error.response?.data?.message || 'Could not delete category. Please retry.');
    } finally {
      setDeletingCategory(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const { data } = await api.get('/books?limit=100');
      setBooks(data.books || []);
    } catch (err) {
      console.error('Failed to load books:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchLendings = async () => {
    try {
      setLoadingLendings(true);
      const { data } = await api.get('/admin/lendings');
      setLendings(data.lendings || []);
    } catch (err) {
      console.error('Failed to load lendings:', err);
    } finally {
      setLoadingLendings(false);
    }
  };

  // Handle Book Add/Edit
  const handleOpenBookModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setBookFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        categoryID: book.categoryID || (categories[0]?.catID || ''),
        price: book.price,
        lendingPricePerWeek: book.lendingPricePerWeek || '2.99',
        stock: book.stock,
        lendableStock: book.lendableStock,
        description: book.description || '',
        coverPhotoUrl: book.coverPhotoUrl || ''
      });
    } else {
      setEditingBook(null);
      setBookFormData({
        title: '',
        author: '',
        isbn: '',
        categoryID: categories[0]?.catID || '',
        price: '19.99',
        lendingPricePerWeek: '2.99',
        stock: '10',
        lendableStock: '5',
        description: '',
        coverPhotoUrl: ''
      });
    }
    setCoverFile(null);
    setShowCategoryCreator(categories.length === 0);
    setShowBookModal(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setSubmittingBook(true);

    const formData = new FormData();
    Object.entries(bookFormData).forEach(([key, val]) => {
      formData.append(key, val);
    });
    if (coverFile) {
      formData.append('coverImage', coverFile);
    }

    try {
      if (editingBook) {
        await api.put(`/admin/books/${editingBook.bookID}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/admin/books', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowBookModal(false);
      fetchBooks();
      fetchCategories();
      fetchStats();
    } catch (err) {
      console.error('Error saving book:', err);
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleDeleteBook = async (bookID) => {
    if (!window.confirm('Are you sure you want to remove this book from the catalogue?')) return;
    try {
      await api.delete(`/admin/books/${bookID}`);
      fetchBooks();
      fetchCategories();
      fetchStats();
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderID, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderID}/status`, { status: newStatus });
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  // Handle Lending Status Update
  const handleUpdateLendingStatus = async (lendID, newStatus) => {
    try {
      await api.put(`/admin/lendings/${lendID}/status`, { status: newStatus });
      fetchLendings();
      fetchStats();
    } catch (err) {
      console.error('Error updating lending:', err);
    }
  };

  // Send Direct Email via Azure Communication Service
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    setEmailStatus('');
    try {
      await api.post('/admin/send-email', emailData);
      setEmailStatus('Email sent successfully.');
      setEmailData({ to: '', subject: '', message: '' });
    } catch (err) {
      setEmailStatus('Failed to send email: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <>
      {/* Page Header band */}
      <div style={{ background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container flex items-center justify-between flex-wrap gap-4">
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>
            Admin Dashboard
          </h1>

          {/* Tab Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#ffffff', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`btn btn-sm ${activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <BookOpen size={14} /> Books & Inventory
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`btn btn-sm ${activeTab === 'categories' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Tags size={14} /> Categories
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Package size={14} /> Orders & Logistics
            </button>
            <button
              onClick={() => setActiveTab('lendings')}
              className={`btn btn-sm ${activeTab === 'lendings' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Clock size={14} /> Lending Requests
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`btn btn-sm ${activeTab === 'email' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Mail size={14} /> Email
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-6" style={{ marginBottom: '36px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)' }}>
            ${stats?.metrics?.totalRevenue ? Number(stats.metrics.totalRevenue).toFixed(2) : '0.00'}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Orders</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} />
            </div>
          </div>
          <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)' }}>
            {stats?.metrics?.totalOrders || 0}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Active Lendings</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)' }}>
            {stats?.metrics?.activeLendings || 0}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Titles</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)' }}>
            {stats?.metrics?.totalBooks || 0}
          </span>
        </div>
      </div>

      {/* TAB 1: Inventory & Book Management */}
      {activeTab === 'inventory' && (
        <div className="card" style={{ padding: '28px' }}>
          <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Book Inventory</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Manage covers, stock levels, and rental rates.
              </p>
            </div>
            <button onClick={() => handleOpenBookModal()} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add New Book
            </button>
          </div>

          {/* Book Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 8px' }}>Book</th>
                  <th style={{ padding: '12px 8px' }}>Category</th>
                  <th style={{ padding: '12px 8px' }}>Buy Price</th>
                  <th style={{ padding: '12px 8px' }}>Lend/Wk</th>
                  <th style={{ padding: '12px 8px' }}>Stock</th>
                  <th style={{ padding: '12px 8px' }}>Lendable</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.bookID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <div className="flex items-center gap-3">
                        <img
                          src={b.coverPhotoUrl || FALLBACK_BOOK_COVER}
                          alt={b.title}
                          onError={handleCoverError}
                          style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div>
                          <strong style={{ display: 'block', color: '#0f172a' }}>{b.title}</strong>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>{b.author}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{b.category?.name || 'General'}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>${Number(b.price).toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', color: '#d97706', fontWeight: 600 }}>${Number(b.lendingPricePerWeek || 2.99).toFixed(2)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${b.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {b.stock} units
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-accent">{b.lendableStock} units</span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenBookModal(b)}
                          style={{ background: '#f1f5f9', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
                          title="Edit Book"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b.bookID)}
                          style={{ background: '#fef2f2', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                          title="Delete Book"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" style={{ fontSize: 18, marginBottom: 20 }}>Categories</h2>
          <CategoryCreateForm onCreated={handleCategoryCreated} />
          {categoryError && (
            <div role="alert" style={{ color: 'var(--danger)', marginBottom: 16 }}>
              <p>{categoryError}</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={fetchCategories} disabled={loadingCategories || deletingCategory}>Refresh Categories</button>
            </div>
          )}
          {categoryMessage && <p role="status" style={{ marginBottom: 16 }}>{categoryMessage}</p>}
          {categoryToDelete && (
            <form onSubmit={handleDeleteCategory} aria-label="Delete category" style={{ borderBlock: '1px solid var(--border)', padding: '20px 0', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, overflowWrap: 'anywhere' }}>Delete "{categoryToDelete.name}"?</h3>
              <p style={{ margin: '12px 0' }}>{categoryToDelete.bookCount} assigned book(s). Books will not be deleted.</p>
              <label className="label">Move books to
                <select className="input" value={replacementCategoryID} onChange={event => setReplacementCategoryID(event.target.value)} required={categoryToDelete.bookCount > 0} disabled={deletingCategory}>
                  <option value="">{categoryToDelete.bookCount > 0 ? 'Select a replacement category' : 'No replacement (empty category)'}</option>
                  {categories.filter(category => category.catID !== categoryToDelete.catID).map(category => (
                    <option key={category.catID} value={category.catID}>{category.name}</option>
                  ))}
                </select>
              </label>
              {categoryToDelete.bookCount > 0 && categories.length < 2 && <p role="status" style={{ marginTop: 12 }}>A replacement category is required. Create another category first.</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={deletingCategory || (categoryToDelete.bookCount > 0 && !replacementCategoryID)}>
                  <Trash2 size={16} /> {deletingCategory ? 'Deleting...' : replacementCategoryID ? 'Move Books & Delete' : 'Delete Category'}
                </button>
                <button type="button" className="btn btn-outline btn-sm" disabled={deletingCategory} onClick={() => { setCategoryToDelete(null); setCategoryError(''); }}>Cancel</button>
              </div>
            </form>
          )}
          {loadingCategories ? <p role="status">Loading categories...</p> : categories.length === 0 ? <p>No categories yet.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Books</th><th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                </tr></thead>
                <tbody>{categories.map(category => (
                  <tr key={category.catID} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 12, overflowWrap: 'anywhere' }}><strong>{category.name}</strong>{category.description && <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{category.description}</p>}</td>
                    <td style={{ padding: 12 }}>{category.bookCount}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button type="button" className="btn btn-ghost btn-sm" title={`Delete ${category.name}`} aria-label={`Delete ${category.name}`} disabled={deletingCategory} onClick={() => {
                        setCategoryToDelete(category); setReplacementCategoryID(''); setCategoryError(''); setCategoryMessage('');
                      }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Orders & Delivery Logistics */}
      {activeTab === 'orders' && (
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Orders & Delivery</h2>

          {loadingOrders ? (
            <p>Loading orders...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map((ord) => (
                <div key={ord.orderID} className="card" style={{ padding: '20px', background: 'var(--bg-main)' }}>
                  <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Order Date: {new Date(ord.createdAt).toLocaleString()}</span>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0 0 0' }}>{ord.orderID}</h4>
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        Customer: <strong>{ord.user?.name || ord.guestName || 'Guest'}</strong> ({ord.user?.email || ord.guestEmail})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.orderID, e.target.value)}
                        className="input"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', fontWeight: 600, background: '#ffffff' }}
                      >
                        <option value="Reviewing">Reviewing</option>
                        <option value="Processing">Processing</option>
                        <option value="Ready">Ready</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>${Number(ord.totalAmount).toFixed(2)}</strong>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                    📍 Destination: <strong>{ord.deliveryAddress}</strong>
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ord.items?.map((item) => (
                      <span key={item.itemID} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                        {item.book?.title} (×{item.quantity})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Lending Requests Queue */}
      {activeTab === 'lendings' && (
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Book Lending Approvals & Overdue Queue</h2>

          {loadingLendings ? (
            <p>Loading lending requests...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {lendings.map((lend) => (
                <div key={lend.lendID} className="card" style={{ padding: '18px', background: '#f8fafc' }}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={lend.book?.coverPhotoUrl || FALLBACK_BOOK_COVER}
                        alt={lend.book?.title}
                        onError={handleCoverError}
                        style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{lend.book?.title}</h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Borrower: <strong>{lend.user?.name}</strong> ({lend.user?.email})
                        </span>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: 4 }}>
                          Duration: {lend.durationDays} Days | Due: {lend.dueDate ? new Date(lend.dueDate).toLocaleDateString() : 'Pending'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`badge ${lend.status === 'Active' ? 'badge-primary' : lend.status === 'Returned' ? 'badge-success' : 'badge-accent'}`}>
                        {lend.status}
                      </span>

                      {lend.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleUpdateLendingStatus(lend.lendID, 'Active')}
                            className="btn btn-primary btn-sm"
                          >
                            Approve Loan
                          </button>
                          <button
                            onClick={() => handleUpdateLendingStatus(lend.lendID, 'Returned')}
                            className="btn btn-outline btn-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {(lend.status === 'Active' || lend.status === 'Overdue') && (
                        <button
                          onClick={() => handleUpdateLendingStatus(lend.lendID, 'Returned')}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: '#10b981', color: '#059669' }}
                        >
                          Mark Received
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Email */}
      {activeTab === 'email' && (
        <div className="card" style={{ maxWidth: '680px', margin: '0 auto', padding: '32px' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Send Email</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Send a message to a customer.
              </p>
            </div>
          </div>

          {emailStatus && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)', color: emailStatus.startsWith('Failed') ? 'var(--danger)' : 'var(--success)', fontSize: '13px' }}>
              {emailStatus}
            </div>
          )}

          <form onSubmit={handleSendEmail}>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Recipient Email Address</label>
              <input
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="customer@example.com"
                className="input"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Email Subject</label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="BookNest Special Update / Rental Notification"
                className="input"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="label">Message Body</label>
              <textarea
                rows="5"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Dear reader, we are pleased to inform you..."
                className="input"
                style={{ resize: 'vertical' }}
                required
              />
            </div>

            <button type="submit" disabled={sendingEmail} className="btn btn-primary" style={{ width: '100%' }}>
              <Send size={16} /> {sendingEmail ? 'Sending...' : 'Send Email'}
            </button>
          </form>
        </div>
      )}

      {/* Book Add/Edit Modal */}
      {showBookModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26, 26, 26, 0.5)', padding: '20px' }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
              {editingBook ? 'Edit Book Details' : 'Add New Book to Inventory'}
            </h2>

            <button type="button" className="btn btn-outline btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowCategoryCreator(current => !current)} aria-expanded={showCategoryCreator}>
              <Plus size={16} /> {showCategoryCreator ? 'Close Category Form' : 'Add Category'}
            </button>
            {showCategoryCreator && <CategoryCreateForm onCreated={handleCategoryCreated} />}
            {categoryError && <p role="alert" style={{ color: 'var(--danger)' }}>{categoryError} <button type="button" className="btn btn-ghost btn-sm" onClick={fetchCategories}>Retry</button></p>}

            <form onSubmit={handleSaveBook}>
              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '14px' }}>
                <div>
                  <label className="label">Book Title *</label>
                  <input
                    type="text"
                    value={bookFormData.title}
                    onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Author Name *</label>
                  <input
                    type="text"
                    value={bookFormData.author}
                    onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '14px' }}>
                <div>
                  <label className="label" htmlFor="book-category">Category *</label>
                  <select
                    id="book-category"
                    value={bookFormData.categoryID}
                    onChange={(e) => setBookFormData({ ...bookFormData, categoryID: e.target.value })}
                    className="input"
                    required
                    disabled={loadingCategories}
                  >
                    <option value="">{loadingCategories ? 'Loading categories...' : categories.length ? 'Select a category' : 'No categories yet'}</option>
                    {categories.map((c) => (
                      <option key={c.catID} value={c.catID}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">ISBN</label>
                  <input
                    type="text"
                    value={bookFormData.isbn}
                    onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                    className="input"
                    placeholder="978-0132350884"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '14px' }}>
                <div>
                  <label className="label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bookFormData.price}
                    onChange={(e) => setBookFormData({ ...bookFormData, price: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Rent/Wk ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bookFormData.lendingPricePerWeek}
                    onChange={(e) => setBookFormData({ ...bookFormData, lendingPricePerWeek: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input
                    type="number"
                    value={bookFormData.stock}
                    onChange={(e) => setBookFormData({ ...bookFormData, stock: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Lendable</label>
                  <input
                    type="number"
                    value={bookFormData.lendableStock}
                    onChange={(e) => setBookFormData({ ...bookFormData, lendableStock: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="label">Cover Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="input"
                  style={{ padding: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="label">Or Cover Image URL</label>
                <input
                  type="url"
                  value={bookFormData.coverPhotoUrl}
                  onChange={(e) => setBookFormData({ ...bookFormData, coverPhotoUrl: e.target.value })}
                  className="input"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label">Synopsis / Description</label>
                <textarea
                  rows="3"
                  value={bookFormData.description}
                  onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                  className="input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBook || loadingCategories || !bookFormData.categoryID}
                  className="btn btn-primary"
                >
                  {submittingBook ? 'Saving Book...' : 'Save to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default AdminDashboard;
