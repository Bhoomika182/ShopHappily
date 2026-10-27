import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, inr } from '../api.js';
import { useAuth } from '../context/Auth.jsx';
import { useCart } from '../context/Cart.jsx';
import { useToast } from '../context/Toast.jsx';
import { ICONS } from '../components/ProductCard.jsx';

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api(`/products/${id}`)
      .then((data) => {
        if (alive) setProduct(data);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Product not found.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="product-page-container">
        <p className="muted" style={{ textAlign: 'center', padding: '4rem 1rem' }}>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-page-container">
        <div className="empty" style={{ margin: '4rem auto' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>🔍</p>
          <h3>Product Not Found</h3>
          <p className="muted">{error || 'This product does not exist or has been removed.'}</p>
          <Link to="/shop" className="btn small" style={{ marginTop: '1rem' }}>← Back to Shop</Link>
        </div>
      </div>
    );
  }

  const out = product.stock === 0;
  const maxQty = Math.min(product.stock || 1, 10);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    for (let i = 0; i < qty; i++) {
      add(product);
    }
    setAdded(true);
    toast(`Added ${qty} × "${product.name}" to your cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-page-container">
      <div className="product-page-nav">
        <Link to="/shop" className="back-link">← Back to catalogue</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{product.name}</span>
      </div>

      <div className="product-page-card">
        <div className="product-modal-grid">
          {/* Left Media */}
          <div className="product-modal-media">
            {product.image ? (
              <div className="modal-img-container">
                <img src={product.image} alt={product.name} className="modal-product-img" />
              </div>
            ) : (
              <div className="modal-img-placeholder">
                <span className="placeholder-emoji">{ICONS[product.category] || '📦'}</span>
                <span className="placeholder-cat">{product.category}</span>
              </div>
            )}
          </div>

          {/* Right Details */}
          <div className="product-modal-info">
            <div className="modal-header-meta">
              <span className="category-pill-tag">
                {ICONS[product.category] || '🏷️'} {product.category[0].toUpperCase() + product.category.slice(1)}
              </span>
              <span className={`stock-status-tag ${out ? 'out' : product.stock <= 5 ? 'low' : 'in'}`}>
                <span className="status-dot"></span>
                {out ? 'Out of Stock' : product.stock <= 5 ? `Low Stock (${product.stock} left)` : `In Stock (${product.stock} available)`}
              </span>
            </div>

            <h1 className="modal-product-title" style={{ fontSize: '1.9rem', margin: '0.4rem 0 0.8rem' }}>
              {product.name}
            </h1>

            <div className="modal-price-row">
              <div className="price-stack">
                <span className="modal-price">{inr(product.price)}</span>
                <span className="tax-inclusive">Inclusive of all taxes</span>
              </div>
            </div>

            {product.tags?.length > 0 && (
              <div className="modal-tags">
                {product.tags.map((t) => (
                  <span key={t} className="tag-pill">#{t}</span>
                ))}
              </div>
            )}

            <div className="modal-desc-box">
              <h3>Product Description</h3>
              <p className="modal-desc-text">{product.description}</p>
            </div>

            <div className="modal-action-row">
              <div className="qty-picker">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1 || out}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  disabled={qty >= maxQty || out}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className={`btn modal-buy-btn ${added ? 'btn-added' : ''}`}
                disabled={out}
                onClick={handleAddToCart}
              >
                {out ? 'Out of Stock' : added ? '✓ Added to Cart' : `Add ${qty > 1 ? `${qty} items` : 'to Cart'}`}
              </button>
            </div>

            <div className="modal-perks">
              <div className="perk-item">
                <span>⚡</span>
                <div>
                  <strong>Fast Delivery</strong>
                  <small>Dispatched in 24 hours</small>
                </div>
              </div>
              <div className="perk-item">
                <span>🛡️</span>
                <div>
                  <strong>Genuine Product</strong>
                  <small>100% verified quality</small>
                </div>
              </div>
              <div className="perk-item">
                <span>🔄</span>
                <div>
                  <strong>7 Days Return</strong>
                  <small>Hassle-free refunds</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
