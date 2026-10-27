import { Link } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';

export default function Welcome() {
  const { user } = useAuth();

  return (
    <div className="welcome-container">
      {/* Hero Section */}
      <section className="welcome-hero">
        <div className="welcome-badge">
          <span className="badge-sparkle">✨</span> AI-Powered Smart E-Commerce
        </div>
        <h1 className="welcome-title">
          Welcome to <span className="welcome-gradient-text">ShopHappily</span>
        </h1>
        <p className="welcome-subtitle">
          Where intelligent discovery meets modern convenience. Explore our handpicked collections, or simply describe what you need in plain language.
        </p>

        <div className="welcome-actions">
          <Link to="/shop" className="btn welcome-btn-primary">
            Explore Store <span className="arrow-icon">→</span>
          </Link>
          {!user ? (
            <Link to="/login" className="btn welcome-btn-secondary">
              Sign In to Account
            </Link>
          ) : (
            <Link to="/orders" className="btn welcome-btn-secondary">
              View Your Orders
            </Link>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="welcome-grid">
          <div className="welcome-card">
            <div className="card-icon-wrap">🤖</div>
            <h3>AI Personal Shopper</h3>
            <p>
              Ask questions in plain English—like "waterproof bags under ₹5,000"—and get streamed, grounded answers instantly.
            </p>
          </div>

          <div className="welcome-card">
            <div className="card-icon-wrap">🎯</div>
            <h3>Smart Vector Search</h3>
            <p>
              Search by vibe, description, or style powered by Redis Vector Search and semantic AI embeddings.
            </p>
          </div>

          <div className="welcome-card">
            <div className="card-icon-wrap">💎</div>
            <h3>Curated Collections</h3>
            <p>
              From designer leather handbags to premium wristwatches, discover verified authentic catalogue pieces.
            </p>
          </div>

          <div className="welcome-card">
            <div className="card-icon-wrap">⚡</div>
            <h3>Instant Real-time Orders</h3>
            <p>
              Enjoy high-speed checkout with atomic inventory reservation and full order tracking from start to delivery.
            </p>
          </div>
        </div>

        {/* Categories Quick Links */}
        <div className="welcome-categories">
          <span className="categories-label">Quick explore:</span>
          <Link to="/shop" className="welcome-chip">🏷️ All Products</Link>
          <Link to="/shop" className="welcome-chip">👜 Designer Bags</Link>
          <Link to="/shop" className="welcome-chip">⌚ Watches</Link>
        </div>
      </section>
    </div>
  );
}
