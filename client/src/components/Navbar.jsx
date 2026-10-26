import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close the mobile menu after navigating
  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const link = (to, label, end = false) => (
    <li>
      <NavLink to={to} end={end}>
        {label}
      </NavLink>
    </li>
  );

  return (
    <header>
      <nav className="navbar">
        <div className="container">
          <Link to={isAdmin ? '/admin' : '/'} className="brand">
            <span className="brand-icon">✚</span> MediCare Pharmacy
          </Link>
          <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            ☰
          </button>
          <ul className={`nav-links ${open ? 'open' : ''}`}>
            {isAdmin ? (
              <>
                {link('/admin', 'Medicines', true)}
                {link('/admin/orders', 'Orders')}
                {link('/admin/users', 'Users')}
                {link('/', 'Storefront', true)}
              </>
            ) : (
              <>
                {link('/', 'Medicines', true)}
                {link(
                  '/cart',
                  <>
                    Cart<span className="cart-badge">{count}</span>
                  </>
                )}
                {user && link('/orders', 'My Orders')}
              </>
            )}
            {user ? (
              <>
                {link('/profile', `Hi, ${user.name.split(' ')[0]}`)}
                <li>
                  <button className="link" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                {link('/login', 'Login')}
                {link('/register', 'Register')}
              </>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}
