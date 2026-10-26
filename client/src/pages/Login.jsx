import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, FormAlert } from '../components/ui';
import { EMAIL_PATTERN } from '../utils/validation';

// Where to go after login: back to the protected page, or the role's home page
export function homeFor(user, from) {
  if (from && (user.role !== 'admin' || from.startsWith('/admin'))) return from;
  return user.role === 'admin' ? '/admin' : '/';
}

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = useLocation().state?.from;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user, from)} replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = {};
    if (!EMAIL_PATTERN.test(form.email.trim())) clientErrors.email = 'Please enter a valid email';
    if (!form.password) clientErrors.password = 'Password is required';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setAlert('Please fix the errors below');
      return;
    }

    setBusy(true);
    setAlert('');
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      toast(`Welcome, ${loggedIn.name}!`, 'success');
      navigate(homeFor(loggedIn, from), { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setAlert(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Log in to place orders and view your order history.</p>
        <form onSubmit={submit} noValidate>
          <FormAlert message={alert} />
          <Field label="Email" name="email" error={errors.email} required>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className={errors.email ? 'invalid' : ''} />
          </Field>
          <Field label="Password" name="password" error={errors.password} required>
            <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={change} className={errors.password ? 'invalid' : ''} />
          </Field>
          <button className="btn btn-block" type="submit" disabled={busy}>
            {busy ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginBottom: 0 }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
