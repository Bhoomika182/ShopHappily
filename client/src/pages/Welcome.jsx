import { Link } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Search,
  Gem,
  Zap,
  Tag,
  ShoppingBag,
  Watch,
} from 'lucide-react';

export default function Welcome() {
  const { user } = useAuth();

  return (
    <div className="welcome-container">
      {/* Hero Section */}
      <section className="welcome-hero">
        <div className="welcome-badge">
          <Sparkles size={14} className="badge-sparkle" />
          <span>AI-Powered Smart E-Commerce</span>
        </div>
        <h1 className="welcome-title">
          Welcome to <span className="welcome-gradient-text">ShopHappily</span>
        </h1>
        <p className="welcome-subtitle">
          Where intelligent discovery meets modern convenience. Explore our handpicked collections, or simply describe what you need in plain language.
        </p>

        <div className="welcome-actions">
          <Link to="/shop" className="btn welcome-btn-primary">
            <span>Explore Store</span>
            <ArrowRight size={18} className="arrow-icon" />
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
            <div className="card-icon-wrap">
              <Bot size={24} className="card-lucide-icon" />
            </div>
            <h3>AI Personal Shopper</h3>
            <p>
              Ask questions in plain English—like "waterproof bags under ₹5,000"—and get streamed, grounded answers instantly.
            </p>
          </div>

          <div className="welcome-card">
            <div className="card-icon-wrap">
              <Search size={24} className="card-lucide-icon" />
            </div>
            <h3>Smart Vector Search</h3>
            <p>
              Search by vibe, description, or style powered by Redis Vector Search and semantic AI embeddings.
            </p>
          </div>

          <div className="welcome-card">
            <div className="card-icon-wrap">
              <Gem size={24} className="card-lucide-icon" />
            </div>
            <h3>Curated Collections</h3>
            <p>
              From designer leather handbags to premium wristwatches, discover verified authentic catalogue pieces.
            </p>
          </div>

          <div className="welcome-card">
            <div className="card-icon-wrap">
              <Zap size={24} className="card-lucide-icon" />
            </div>
            <h3>Instant Real-time Orders</h3>
            <p>
              Enjoy high-speed checkout with atomic inventory reservation and full order tracking from start to delivery.
            </p>
          </div>
        </div>

        {/* Categories Quick Links */}
        <div className="welcome-categories">
          <span className="categories-label">Quick explore:</span>
          <Link to="/shop" className="welcome-chip">
            <Tag size={13} className="chip-icon" />
            <span>All Products</span>
          </Link>
          <Link to="/shop" className="welcome-chip">
            <ShoppingBag size={13} className="chip-icon" />
            <span>Designer Bags</span>
          </Link>
          <Link to="/shop" className="welcome-chip">
            <Watch size={13} className="chip-icon" />
            <span>Watches</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
