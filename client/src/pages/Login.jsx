import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';

export default function Login({ defaultMode }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialMode = defaultMode || (location.pathname === '/signup' ? 'register' : 'login');
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (defaultMode) {
      setMode(defaultMode);
      setError('');
    } else if (location.pathname === '/signup') {
      setMode('register');
      setError('');
    } else if (location.pathname === '/login') {
      setMode('login');
      setError('');
    }
  }, [location.pathname, defaultMode]);

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const target = (mode === 'register' && form.role === 'admin') ? '/admin' : '/';
      await (mode === 'login'
        ? login({ email: form.email, password: form.password })
        : register({ name: form.name, email: form.email, password: form.password, role: form.role }));
      navigate(target);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(email, password, role = 'user') {
    setForm((prev) => ({ ...prev, email, password, role }));
    setError('');
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Top Gradient Glow Accent */}
        <div className="auth-card-top-accent" />

        {/* Tab Switcher for Sign In / Sign Up */}
        <div className="auth-tabs" role="tablist" aria-label="Sign in or Sign up">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            <span className="auth-tab-icon">🔐</span> Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            <span className="auth-tab-icon">✨</span> Create Account
          </button>
        </div>

        {/* Header Section */}
        <div className="auth-header">
          <div className="auth-badge">
            {mode === 'login' ? '👋 Welcome back' : '🚀 Quick & Easy Setup'}
          </div>
          <h1 className="auth-title">
            {mode === 'login' ? (
              <>Sign in to <span className="auth-highlight">ShopHappily</span></>
            ) : (
              <>Create your <span className="auth-highlight">account</span></>
            )}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Enter your credentials to access your cart, order history, and AI shopper.'
              : 'Join today to enjoy intelligent Redis vector search and real-time orders.'}
          </p>
        </div>

        {/* Demo Quick-Fill Bar (Sign In mode) */}
        {mode === 'login' && (
          <div className="auth-demo-banner">
            <span className="demo-label">Demo Quick Fill:</span>
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemo('admin@shophappily.dev', 'Admin@12345', 'admin')}
              title="Click to fill Demo Administrator credentials"
            >
              ⚡ Admin
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemo('shopper@shophappily.dev', 'ShopHappily@123', 'user')}
              title="Click to fill Demo Shopper credentials"
            >
              🛍️ Shopper
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span className="auth-error-text">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="auth-form" noValidate>
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div className="auth-field">
                <label htmlFor="auth-name" className="auth-label">
                  Full Name
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">👤</span>
                  <input
                    id="auth-name"
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    required
                    autoComplete="name"
                    placeholder="e.g. Alex Morgan"
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Account Type Selection */}
              <div className="auth-field">
                <label className="auth-label">Account Role</label>
                <div className="auth-role-grid">
                  <button
                    type="button"
                    className={`auth-role-card ${form.role === 'user' ? 'selected' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, role: 'user' }))}
                  >
                    <div className="role-icon">🛍️</div>
                    <div className="role-info">
                      <span className="role-name">Customer</span>
                      <span className="role-desc">Browse, shop & AI search</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-card ${form.role === 'admin' ? 'selected' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, role: 'admin' }))}
                  >
                    <div className="role-icon">⚡</div>
                    <div className="role-info">
                      <span className="role-name">Administrator</span>
                      <span className="role-desc">Manage store & products</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">✉️</span>
              <input
                id="auth-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="auth-password" className="auth-label">
                Password
              </label>
              {mode === 'register' && (
                <span className="auth-label-hint">Min 8 characters</span>
              )}
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required
                minLength={mode === 'register' ? 8 : 1}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                className="auth-input"
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn auth-submit-btn"
            disabled={busy}
          >
            {busy ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <span>
                {mode === 'login' ? 'Sign In to Account →' : 'Create Free Account →'}
              </span>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            {mode === 'login' ? "Don't have an account yet?" : 'Already have an account?'}
            {' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Sign up for free' : 'Sign in here'}
            </button>
          </p>

          <div className="auth-security-note">
            <span>🔒 256-bit SSL Secure</span>
            <span className="dot">•</span>
            <span>⚡ Redis Fast Session</span>
            <span className="dot">•</span>
            <Link to="/shop" className="auth-browse-link">Browse as guest</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
