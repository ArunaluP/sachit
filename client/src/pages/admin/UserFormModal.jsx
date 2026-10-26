import { useState } from 'react';
import { api, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Field, FormAlert, Modal } from '../../components/ui';
import { validateUser } from '../../utils/validation';

// Used for both creating a new account and editing an existing one
export default function UserFormModal({ user, isSelf, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || 'customer',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const invalid = (field) => (errors[field] ? 'invalid' : '');

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = validateUser(form, { requirePassword: !isEdit });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setAlert('Please fix the errors below');
      return;
    }

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      role: form.role,
      ...(form.password && { password: form.password }),
    };
    setBusy(true);
    setAlert('');
    try {
      const res = isEdit
        ? await api(`/users/${user._id}`, { method: 'PUT', body })
        : await api('/users', { method: 'POST', body });
      toast(res.message, 'success');
      onSaved(res.data);
    } catch (err) {
      setErrors(fieldErrors(err));
      setAlert(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={isEdit ? `Edit ${user.name}` : 'Add user'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          <FormAlert message={alert} />
          <div className="form-row">
            <Field label="Full name" name="name" error={errors.name} required>
              <input id="name" name="name" maxLength={60} value={form.name} onChange={change} className={invalid('name')} autoFocus />
            </Field>
            <Field label="Email" name="email" error={errors.email} required>
              <input id="email" name="email" type="email" value={form.email} onChange={change} className={invalid('email')} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Phone number" name="phone" error={errors.phone}>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={change} className={invalid('phone')} />
            </Field>
            <Field label="Role" name="role" error={errors.role} required>
              <select id="role" name="role" value={form.role} onChange={change} disabled={isSelf}>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          <Field label="Address" name="address" error={errors.address}>
            <textarea id="address" name="address" maxLength={200} value={form.address} onChange={change} className={invalid('address')} />
          </Field>
          <Field label={isEdit ? 'New password (leave blank to keep current)' : 'Password'} name="password" error={errors.password} required={!isEdit}>
            <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} className={invalid('password')} />
          </Field>
          {isSelf && <div className="alert alert-info">You cannot change your own role.</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
