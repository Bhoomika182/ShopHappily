import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import {
  Lock,
  UserPlus,
  LogIn,
  Sparkles,
  User,
  Mail,
  Eye,
  EyeOff,
  ShoppingBag,
  ShieldCheck,
  Shield,
  Zap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

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
        {/* Top Accent Gradient Line */}
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
            <LogIn size={16} className="auth-tab-icon" />
            <span>Sign In</span>
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
            <UserPlus size={16} className="auth-tab-icon" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="auth-header">

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
              : 'Join today to experience intelligent vector search and instant checkout.'}
          </p>
        </div>



        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="auth-error-icon" />
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
                  <User size={16} className="auth-input-icon" />
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
                    <div className="role-icon-box">
                      <ShoppingBag size={18} />
                    </div>
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
                    <div className="role-icon-box">
                      <ShieldCheck size={18} />
                    </div>
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
              <Mail size={16} className="auth-input-icon" />
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
              <Lock size={16} className="auth-input-icon" />
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              <span className="auth-btn-content">
                <span>{mode === 'login' ? 'Sign In to Account' : 'Create Free Account'}</span>
                <ArrowRight size={16} className="btn-arrow" />
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
            <span className="sec-item">
              <Shield size={13} className="sec-icon" />
              256-bit SSL Secure
            </span>
            <span className="dot">•</span>
            <span className="sec-item">
              <CheckCircle2 size={13} className="sec-icon" />
              Redis Fast Session
            </span>
            <span className="dot">•</span>
            <Link to="/shop" className="auth-browse-link">Browse as guest</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
