import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inr } from '../api.js';
import { useAuth } from '../context/Auth.jsx';
import { useCart } from '../context/Cart.jsx';
import { useToast } from '../context/Toast.jsx';
import { ICONS } from './ProductCard.jsx';

export default function ProductModal({ product, onClose }) {
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!product) return null;

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
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close product details">
          ✕
        </button>

        <div className="product-modal-grid">
          {/* Left Column: Big Product Image */}
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
            {product.similarity != null && (
              <div className="modal-match-badge">
                ⚡ {Math.round(product.similarity * 100)}% Search Match
              </div>
            )}
          </div>

          {/* Right Column: Complete Details */}
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

            <h2 id="modal-title" className="modal-product-title">{product.name}</h2>

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

            {/* Purchase Controls */}
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

            {/* Store Promises */}
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
