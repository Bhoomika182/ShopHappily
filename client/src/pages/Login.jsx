import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const target = (mode === 'register' && form.role === 'admin') ? '/admin' : '/';
      await (mode === 'login' ? login({ email: form.email, password: form.password }) : register(form));
      navigate(target);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="narrow auth">
      <h1>{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <>
            <label>
              Full Name
              <input value={form.name} onChange={set('name')} required autoComplete="name" placeholder="" />
            </label>
            <label>
              Account Type
              <select value={form.role} onChange={set('role')} className="role-dropdown" aria-label="Account type">
                <option value="user">🛍️ Customer (Browse & Shop)</option>
                <option value="admin">⚡ Administrator (Manage Store & Products)</option>
              </select>
            </label>
          </>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} required autoComplete="email" placeholder="" /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} required minLength={mode === 'register' ? 8 : 1}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="" />
          {mode === 'register' && <small className="muted" style={{ display: 'block', marginTop: '0.25rem' }}>At least 8 characters.</small>}
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy} style={{ marginTop: '0.5rem' }}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="muted">
        {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
        <button className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
      {/* {mode === 'login' && <p className="muted small-print">Demo admin: admin@shophappily.dev / Admin@12345</p>} */}
    </section>
  );
}
