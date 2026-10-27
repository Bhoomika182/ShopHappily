import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, inr, newKey } from '../api.js';
import { useCart } from '../context/Cart.jsx';
import { useToast } from '../context/Toast.jsx';
import { ICONS } from '../components/ProductCard.jsx';

export default function CartPage() {
  const { cart, setQty, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const idemKey = useRef(newKey());

  async function checkout() {
    setBusy(true);
    try {
      await api('/orders', { method: 'POST', headers: { 'Idempotency-Key': idemKey.current } });
      idemKey.current = newKey();
      await refresh();
      toast('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      toast(err.message, 'error');
      refresh();
    } finally {
      setBusy(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="empty-cart-card">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p className="empty-cart-desc">
            Looks like you haven't added anything to your cart yet. Explore our curated catalogue and find something you love!
          </p>
          <Link to="/" className="btn primary-btn-glow">
            Explore Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const totalItemsCount = cart.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="cart-page-wrapper">
      <div className="cart-header-row">
        <div>
          <h1 className="cart-page-title">Shopping Cart</h1>
          <p className="cart-subtitle">Review your selected items before checkout</p>
        </div>
        <span className="cart-count-badge">
          {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="cart-grid-layout">
        {/* Left Column: Cart Items List */}
        <div className="cart-items-column">
          <div className="cart-items-card">
            <ul className="cart-items-list">
              {cart.items.map(({ product, qty }) => (
                <li key={product._id} className="cart-item-row">
                  {/* Product Image Box */}
                  <Link to={`/product/${product._id}`} className="cart-thumb-box" aria-label={`View ${product.name}`}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="cart-thumb-img" />
                    ) : (
                      <span className="cart-thumb-emoji">{ICONS[product.category] || '📦'}</span>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="cart-item-main">
                    <div className="cart-item-meta">
                      {product.category && (
                        <span className="cart-category-tag">
                          {ICONS[product.category] || '🏷️'} {product.category}
                        </span>
                      )}
                      <span className="cart-in-stock-tag">✓ In Stock</span>
                    </div>

                    <Link to={`/product/${product._id}`} className="cart-product-title">
                      {product.name}
                    </Link>

                    {product.description && (
                      <p className="cart-item-desc">
                        {product.description.slice(0, 85)}
                        {product.description.length > 85 ? '…' : ''}
                      </p>
                    )}

                    <div className="cart-unit-price">
                      {inr(product.price)} <span className="unit-label">each</span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="cart-item-actions">
                    <div className="cart-qty-stepper">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(product._id, qty - 1)}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <span className="qty-val">{qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={qty >= 10 || (product.stock != null && qty >= product.stock)}
                        onClick={() => setQty(product._id, qty + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-total">
                      {inr(product.price * qty)}
                    </div>

                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => setQty(product._id, 0)}
                      aria-label={`Remove ${product.name} from cart`}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <aside className="cart-summary-column">
          <div className="order-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-breakdown">
              <div className="summary-row">
                <span className="summary-label">Subtotal ({totalItemsCount} items)</span>
                <span className="summary-value">{inr(cart.total)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Estimated Delivery</span>
                <span className="summary-value free-shipping">FREE</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Estimated Taxes</span>
                <span className="summary-value taxes-note">Included</span>
              </div>
            </div>

            <div className="summary-divider" />

            <div className="summary-total-row">
              <div>
                <strong className="total-title">Total Amount</strong>
                <small className="total-subtext">Inclusive of all duties & taxes</small>
              </div>
              <span className="grand-total-amount">{inr(cart.total)}</span>
            </div>

            <button
              className="btn place-order-btn"
              disabled={busy}
              onClick={checkout}
            >
              {busy ? 'Processing Order…' : 'Proceed to Checkout →'}
            </button>

            <div className="summary-perks">
              <div className="summary-perk-item">
                <span>🔒</span>
                <div>
                  <strong>Secure 256-bit Checkout</strong>
                  <small>Your payment details are protected</small>
                </div>
              </div>
              <div className="summary-perk-item">
                <span>⚡</span>
                <div>
                  <strong>Fast Track Delivery</strong>
                  <small>Dispatched within 24 hours</small>
                </div>
              </div>
              <div className="summary-perk-item">
                <span>🔄</span>
                <div>
                  <strong>7 Days Easy Return</strong>
                  <small>100% money back guarantee</small>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
