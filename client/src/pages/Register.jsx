import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, FormAlert } from '../components/ui';
import { validateUser } from '../utils/validation';
import { homeFor } from './Login';

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const invalid = (field) => (errors[field] ? 'invalid' : '');

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = validateUser(form, { requirePassword: true, checkConfirm: true });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setAlert('Please fix the errors below');
      return;
    }

    setBusy(true);
    setAlert('');
    try {
      const { confirmPassword, ...values } = form;
      const created = await register({ ...values, name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), address: values.address.trim() });
      toast(`Welcome, ${created.name}!`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setAlert(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="card auth-card">
        <h1>Create an account</h1>
        <p className="muted">Register to order medicines online.</p>
        <form onSubmit={submit} noValidate>
          <FormAlert message={alert} />
          <Field label="Full name" name="name" error={errors.name} required>
            <input id="name" name="name" maxLength={60} autoComplete="name" value={form.name} onChange={change} className={invalid('name')} />
          </Field>
          <Field label="Email" name="email" error={errors.email} required>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className={invalid('email')} />
          </Field>
          <div className="form-row">
            <Field label="Password" name="password" error={errors.password} required>
              <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} className={invalid('password')} />
            </Field>
            <Field label="Confirm password" name="confirmPassword" error={errors.confirmPassword} required>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={change} className={invalid('confirmPassword')} />
            </Field>
          </div>
          <Field label="Phone number" name="phone" error={errors.phone}>
            <input id="phone" name="phone" type="tel" placeholder="0771234567" autoComplete="tel" value={form.phone} onChange={change} className={invalid('phone')} />
          </Field>
          <Field label="Delivery address" name="address" error={errors.address}>
            <textarea id="address" name="address" maxLength={200} autoComplete="street-address" value={form.address} onChange={change} className={invalid('address')} />
          </Field>
          <button className="btn btn-block" type="submit" disabled={busy}>
            {busy ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginBottom: 0 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
