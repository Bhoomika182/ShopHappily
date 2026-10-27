import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard, { ICONS } from '../components/ProductCard.jsx';
import ProductModal from '../components/ProductModal.jsx';

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function Shop() {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('keyword'); // keyword = Mongo text index, smart = Redis vector search
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const q = useDebounced(search.trim(), 300);

  useEffect(() => {
    api('/products/categories')
      .then((cats) => Array.isArray(cats) && setCategories(cats))
      .catch(() => {});
  }, []);
  useEffect(() => { setPage(1); }, [q, category, sort, mode]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    const smart = mode === 'smart' && q.length >= 2;
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (smart) params.set('q', q);
    else {
      if (q) params.set('search', q);
      params.set('sort', q && sort === 'newest' ? 'relevance' : sort);
      params.set('page', page);
    }
    api(`/products${smart ? '/semantic' : ''}?${params}`)
      .then((d) =>
        alive &&
        setData({
          items: Array.isArray(d?.items) ? d.items : [],
          total: d?.total ?? (Array.isArray(d?.items) ? d.items.length : 0),
          pages: d?.pages ?? 1,
          cache: d?._cache,
        })
      )
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, mode, category, sort, page]);

  return (
    <>
      <section className="hero">
        <h1>Find the right thing, fast.</h1>
        <p>Search by name, or switch to smart search and describe what you need in your own words.</p>
      </section>

      <div className="toolbar">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products"
          placeholder={mode === 'smart' ? 'Describe what you are looking for...' : 'Search products...'} />
        <div className="seg" role="group" aria-label="Search type">
          <button className={mode === 'keyword' ? 'on' : ''} onClick={() => setMode('keyword')}>Keyword</button>
          <button className={mode === 'smart' ? 'on' : ''} onClick={() => setMode('smart')}>Smart</button>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" disabled={mode === 'smart' && q.length >= 2}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="chips">
        <button className={`chip ${category === '' ? 'on' : ''}`} onClick={() => setCategory('')}>All</button>
        {(Array.isArray(categories) ? categories : []).map((c) => (
          <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>
            {ICONS[c] || '🏷️'} {c ? c[0].toUpperCase() + c.slice(1) : ''}
          </button>
        ))}
        {data.cache && <span className="cache-note" title="Served via Redis cache-aside">Catalogue cache: {data.cache}</span>}
      </div>

      {error && <p className="error">{error}</p>}
      {!loading && !error && (!data?.items || data.items.length === 0) && (
        <div className="empty">
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>
            {(!categories || categories.length === 0) && !search && !category ? '📦' : '🔍'}
          </p>
          <h3 style={{ margin: '0 0 0.5rem' }}>
            {(!categories || categories.length === 0) && !search && !category
              ? 'Store catalogue is empty'
              : 'No products found'}
          </h3>
          <p className="muted" style={{ margin: '0 0 1.25rem', maxWidth: '440px', lineHeight: 1.5 }}>
            {(!categories || categories.length === 0) && !search && !category
              ? 'No products have been added yet. Add your inventory in the Admin dashboard to get started.'
              : mode === 'keyword'
                ? 'Try switching to Smart Search, which understands natural descriptions.'
                : 'Try searching with different descriptive words.'}
          </p>
          {(!categories || categories.length === 0) && !search && !category ? (
            <Link to="/admin" className="btn small">Open Admin Dashboard</Link>
          ) : mode === 'keyword' ? (
            <button className="btn small" onClick={() => setMode('smart')}>Switch to Smart Search</button>
          ) : (
            <button className="btn ghost small" onClick={() => { setSearch(''); setCategory(''); }}>Clear filters</button>
          )}
        </div>
      )}
      <div className={`grid ${loading ? 'dim' : ''}`}>
        {(Array.isArray(data?.items) ? data.items : []).map((p) => <ProductCard key={p._id} product={p} onSelect={setSelectedProduct} />)}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {data.pages > 1 && (
        <div className="pager">
          <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {data.pages}</span>
          <button className="btn ghost small" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
