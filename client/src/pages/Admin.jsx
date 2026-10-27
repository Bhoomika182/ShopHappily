import { useEffect, useState } from 'react';
import { api, inr } from '../api.js';
import { useToast } from '../context/Toast.jsx';
import { ICONS } from '../components/ProductCard.jsx';

const BLANK = { name: '', description: '', price: '', category: '', stock: '', tags: '', image: '' };

export default function Admin() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => {
    api('/products?limit=100').then((d) => setItems(d.items || [])).catch(() => {});
    api('/products/categories').then((cats) => setCategories(cats || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setForm((prev) => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.85) }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim().toLowerCase(),
        price: Number(form.price),
        stock: Number(form.stock),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        image: form.image.trim(),
      };
      const { indexed } = await api('/admin/products', { method: 'POST', body });
      toast(indexed ? 'Product saved and indexed successfully!' : 'Product saved.', 'info');
      setForm(BLANK);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api(`/admin/products/${p._id}`, { method: 'DELETE' });
      toast(`Deleted "${p.name}"`, 'info');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function reindex() {
    setBusy(true);
    try {
      const r = await api('/admin/reindex', { method: 'POST' });
      toast(`Index refreshed: ${r.products} products indexed`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const filteredItems = items.filter((p) => {
    const matchSearch = !searchFilter || p.name.toLowerCase().includes(searchFilter.toLowerCase()) || p.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalStock = items.reduce((acc, p) => acc + (p.stock || 0), 0);
  const dynamicCategories = Array.from(
    new Set([...categories, ...items.map((p) => p.category).filter(Boolean)])
  ).sort();
  const activeCategories = dynamicCategories.length;

  return (
    <div className="admin-container">
      {/* Top Header */}
      <div className="admin-topbar">
        <div>
          <h1>Product Management</h1>
          <p className="muted">Add, edit and monitor your store inventory.</p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn ghost small" disabled={busy} onClick={reindex}>
            ⚡ Rebuild Search Index
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <strong className="stat-value">{items.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Units in Stock</span>
          <strong className="stat-value">{totalStock}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Categories</span>
          <strong className="stat-value">{activeCategories}</strong>
        </div>
      </div>

      {/* 2-Column Balanced Dashboard */}
      <div className="dashboard-grid">
        {/* Left Card: Add Product */}
        <div className="dashboard-card form-panel">
          <div className="panel-header">
            <h2>Add New Product</h2>
            <p className="muted">Enter details to publish to the storefront.</p>
          </div>

          <form onSubmit={create} className="product-form">
            <div className="form-group">
              <label htmlFor="prod-name">Product Name *</label>
              <input
                id="prod-name"
                value={form.name}
                onChange={set('name')}
                required
                minLength={2}
                placeholder="e.g. Wireless Noise Cancelling Headphones"
              />
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="prod-cat">Category *</label>
                <input
                  id="prod-cat"
                  type="text"
                  list="category-suggestions"
                  value={form.category}
                  onChange={set('category')}
                  placeholder="e.g. electronics, footwear, books"
                  required
                />
                <datalist id="category-suggestions">
                  {dynamicCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {dynamicCategories.length > 0 && (
                  <div className="category-quick-pills">
                    {dynamicCategories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`cat-pill-chip ${form.category.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                        onClick={() => setForm((prev) => ({ ...prev, category: c }))}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="prod-price">Price (₹) *</label>
                <input
                  id="prod-price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={set('price')}
                  required
                  placeholder="2499"
                />
              </div>
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="prod-stock">Stock Units *</label>
                <input
                  id="prod-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={set('stock')}
                  required
                  placeholder="10"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prod-tags">Tags <small>(optional)</small></label>
                <input
                  id="prod-tags"
                  value={form.tags}
                  onChange={set('tags')}
                  placeholder="audio, wireless, bass"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prod-desc">Description *</label>
              <textarea
                id="prod-desc"
                value={form.description}
                onChange={set('description')}
                required
                minLength={10}
                rows={4}
                placeholder="Detailed description of features, specifications, and warranty..."
              />
            </div>

            <div className="form-group">
              <label>Product Photo <small className="muted">(optional)</small></label>
              {form.image ? (
                <div className="photo-preview-card">
                  <img src={form.image} alt="Preview" className="photo-preview-img" />
                  <div className="photo-preview-info">
                    <span className="photo-ready-badge">✓ Photo ready</span>
                    <button
                      type="button"
                      className="photo-remove-btn"
                      onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="photo-upload-container">
                  <label className="photo-dropzone" htmlFor="prod-file-upload">
                    <span className="dropzone-icon">📷</span>
                    <span className="dropzone-title">Click to choose image or drag & drop</span>
                    <span className="dropzone-hint">PNG, JPG, WEBP (auto-compressed)</span>
                    <input
                      id="prod-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <div className="photo-divider"><span>or paste image URL</span></div>
                  <input
                    type="url"
                    value={form.image}
                    onChange={set('image')}
                    placeholder="https://example.com/product.jpg"
                    className="photo-url-input"
                  />
                </div>
              )}
            </div>

            <button className="btn" disabled={busy} type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
              {busy ? 'Saving...' : 'Publish Product'}
            </button>
          </form>
        </div>

        {/* Right Card: Products Table */}
        <div className="dashboard-card list-panel">
          <div className="panel-header table-panel-header">
            <div>
              <h2>Products in Store ({filteredItems.length})</h2>
              <p className="muted">Live store inventory.</p>
            </div>
            <div className="filter-controls">
              <input
                type="search"
                placeholder="Search..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="filter-search"
              />
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="filter-select">
                <option value="all">All Categories</option>
                {dynamicCategories.map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-catalogue">
              <div className="empty-icon">📦</div>
              <h3>No products in catalogue</h3>
              <p className="muted">Fill in the form on the left to add your first product.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((p) => (
                    <tr key={p._id}>
                      <td className="product-title-cell">
                        <div className="table-product-row">
                          {p.image ? (
                            <img src={p.image} alt="" className="table-product-thumb" />
                          ) : (
                            <span className="table-product-placeholder">{ICONS[p.category] || '📦'}</span>
                          )}
                          <div>
                            <strong>{p.name}</strong>
                            <small className="muted">{p.description}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">{p.category}</span>
                      </td>
                      <td>
                        <strong className="price-tag">{inr(p.price)}</strong>
                      </td>
                      <td>
                        <span className={`stock-pill ${p.stock <= 5 ? (p.stock === 0 ? 'out' : 'low') : 'in'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="delete-btn" onClick={() => remove(p)} title="Delete product">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
