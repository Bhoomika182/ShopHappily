import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { useCart } from '../context/Cart.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  return (
    <header className="top">
      <div className="top-inner">
        <Link to="/" className="brand">ShopHappily</Link>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="top-right">
          {user ? (
            <>
              <Link to="/cart" className="cart-pill" aria-label={`Cart, ${cart.count} items`}>
                Cart <b>{cart.count}</b>
              </Link>
              <div className="user-profile-badge" title={user.email}>
                <span className="user-avatar" aria-hidden="true">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="user-name">{user.name ? user.name.split(' ')[0] : 'User'}</span>
                {user.role === 'admin' && <span className="admin-tag">Admin</span>}
              </div>
              <button className="btn-logout" onClick={logout} aria-label="Sign out of account" title="Sign out">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn small">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
