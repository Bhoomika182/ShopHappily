import { useNavigate } from 'react-router-dom';
import { inr } from '../api.js';
import { useAuth } from '../context/Auth.jsx';
import { useCart } from '../context/Cart.jsx';

export const ICONS = { outdoor: '⛺', electronics: '🎧', fitness: '🏃', kitchen: '🍳', office: '🪑', home: '🛋️' };

export default function ProductCard({ product, onSelect }) {
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const out = product.stock === 0;

  const handleCardClick = () => {
    if (onSelect) onSelect(product);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    add(product);
  };

  return (
    <article
      className="card clickable-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
      aria-label={`View details for ${product.name}`}
    >
      <div className={`thumb ${product.image ? 'has-img' : `cat-${product.category}`}`} aria-hidden="true">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-card-img" loading="lazy" />
        ) : (
          <span>{ICONS[product.category] || '📦'}</span>
        )}
        {product.similarity != null && <em className="match">{Math.round(product.similarity * 100)}% match</em>}
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="desc">{product.description}</p>
        <div className="card-foot">
          <div>
            <strong className="price">{inr(product.price)}</strong>
            <span className={`stock ${out ? 'out' : product.stock <= 5 ? 'low' : ''}`}>
              {out ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
            </span>
          </div>
          <button
            className="btn small"
            disabled={out}
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
