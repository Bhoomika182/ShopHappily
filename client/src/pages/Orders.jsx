import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, inr } from '../api.js';
import { ICONS } from '../components/ProductCard.jsx';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/orders')
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="orders-page-wrapper">
        <div className="orders-loading-state">
          <span className="spinner" />
          <p>Loading your order history…</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="orders-page-wrapper">
        <div className="empty-orders-card">
          <div className="empty-orders-icon">📦</div>
          <h2>No Orders Yet</h2>
          <p className="empty-orders-desc">
            You haven't placed any orders with us yet. Discover our latest arrivals and designer items in our shop!
          </p>
          <Link to="/shop" className="btn primary-btn-glow">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper">
      <div className="orders-header-row">
        <div>
          <h1 className="orders-page-title">My Orders</h1>
          <p className="orders-subtitle">Track and view your past purchases and delivery history</p>
        </div>
        <span className="orders-count-badge">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const timeStr = new Date(order.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const shortId = order._id.slice(-8).toUpperCase();

          return (
            <article key={order._id} className="order-history-card">
              {/* Card Header: Meta & Status */}
              <div className="order-card-header">
                <div className="order-header-left">
                  <span className="order-id-tag">Order #{shortId}</span>
                  <span className="order-datetime">
                    📅 {dateStr} at {timeStr}
                  </span>
                </div>
                <div className="order-header-right">
                  <span className={`order-status-badge ${order.status}`}>
                    <span className="status-dot" />
                    {order.status === 'paid' ? 'Paid & Confirmed' : order.status}
                  </span>
                </div>
              </div>

              {/* Items List with Images & Full Info */}
              <div className="order-card-body">
                <ul className="order-items-list">
                  {order.items.map((item, idx) => {
                    const prodId =
                      typeof item.product === 'object' && item.product !== null
                        ? String(item.product._id || '')
                        : String(item.product || '');
                    const productLink = prodId ? `/product/${prodId}` : '#';

                    return (
                      <li key={prodId || idx} className="order-item-row">
                        {/* Product Thumbnail */}
                        <Link
                          to={productLink}
                          className="order-item-thumb-box"
                          aria-label={`View ${item.name}`}
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="order-item-img" />
                          ) : (
                            <span className="order-item-emoji">{ICONS[item.category] || '📦'}</span>
                          )}
                        </Link>

                        {/* Product Details */}
                        <div className="order-item-info">
                          <div className="order-item-tags">
                            {item.category && (
                              <span className="order-cat-tag">
                                {ICONS[item.category] || '🏷️'} {item.category}
                              </span>
                            )}
                          </div>

                          <Link to={productLink} className="order-item-title">
                            {item.name}
                          </Link>

                          {item.description && (
                            <p className="order-item-desc">
                              {item.description.slice(0, 110)}
                              {item.description.length > 110 ? '…' : ''}
                            </p>
                          )}

                          <div className="order-item-qty-price">
                            <span className="qty-tag">Qty: {item.qty}</span>
                            <span className="unit-tag">× {inr(item.price)}</span>
                          </div>
                        </div>

                        {/* Total for this line & View CTA */}
                        <div className="order-item-right">
                          <span className="order-line-total">{inr(item.price * item.qty)}</span>
                          <Link to={productLink} className="btn-view-item">
                            View Details →
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Card Footer: Summary & Total */}
              <div className="order-card-footer">
                <div className="order-footer-note">
                  <span>✓ Standard Delivery (Estimated 2-3 business days)</span>
                </div>
                <div className="order-footer-total">
                  <span className="total-label">Order Total:</span>
                  <strong className="total-amount">{inr(order.total)}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
