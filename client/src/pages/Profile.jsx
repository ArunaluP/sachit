import { useState } from 'react';
import { api, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, FormAlert } from '../components/ui';
import { formatDate } from '../utils/format';
import { passwordProblem, validateUser } from '../utils/validation';

function ProfileForm() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const invalid = (field) => (errors[field] ? 'invalid' : '');

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = validateUser(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setAlert('Please fix the errors below');
      return;
    }
    setBusy(true);
    setAlert('');
    try {
      const res = await api('/auth/me', {
        method: 'PUT',
        body: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim() },
      });
      updateUser(res.user);
      toast(res.message, 'success');
    } catch (err) {
      setErrors(fieldErrors(err));
      setAlert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2 style={{ fontSize: '1.15rem' }}>Personal details</h2>
      <FormAlert message={alert} />
      <Field label="Full name" name="name" error={errors.name} required>
        <input id="name" name="name" maxLength={60} value={form.name} onChange={change} className={invalid('name')} />
      </Field>
      <Field label="Email" name="email" error={errors.email} required>
        <input id="email" name="email" type="email" value={form.email} onChange={change} className={invalid('email')} />
      </Field>
      <Field label="Phone number" name="phone" error={errors.phone}>
        <input id="phone" name="phone" type="tel" value={form.phone} onChange={change} className={invalid('phone')} />
      </Field>
      <Field label="Delivery address" name="address" error={errors.address}>
        <textarea id="address" name="address" maxLength={200} value={form.address} onChange={change} className={invalid('address')} />
      </Field>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const invalid = (field) => (errors[field] ? 'invalid' : '');

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = {};
    if (!form.currentPassword) clientErrors.currentPassword = 'Current password is required';
    const problem = passwordProblem(form.newPassword);
    if (problem) clientErrors.newPassword = problem;
    if (form.confirmPassword !== form.newPassword) clientErrors.confirmPassword = 'Passwords do not match';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setAlert('Please fix the errors below');
      return;
    }
    setBusy(true);
    setAlert('');
    try {
      const res = await api('/auth/password', {
        method: 'PUT',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setForm(empty);
      toast(res.message, 'success');
    } catch (err) {
      setErrors(fieldErrors(err));
      setAlert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2 style={{ fontSize: '1.15rem' }}>Change password</h2>
      <FormAlert message={alert} />
      <Field label="Current password" name="currentPassword" error={errors.currentPassword} required>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={change} className={invalid('currentPassword')} />
      </Field>
      <Field label="New password" name="newPassword" error={errors.newPassword} required>
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={change} className={invalid('newPassword')} />
      </Field>
      <Field label="Confirm new password" name="confirmPassword" error={errors.confirmPassword} required>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={change} className={invalid('confirmPassword')} />
      </Field>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>
            {user.role === 'admin' ? 'Administrator' : 'Customer'} account · member since {formatDate(user.createdAt)}
          </p>
        </div>
      </div>
      <div className="cart-layout">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}
