import { useState } from 'react';
import { api, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useMeta from '../../hooks/useMeta';
import { Field, FormAlert, Modal } from '../../components/ui';
import { validateMedicine } from '../../utils/validation';

const EMPTY = {
  name: '',
  genericName: '',
  category: '',
  dosageForm: 'Tablet',
  strength: '',
  manufacturer: '',
  price: '',
  stock: '',
  expiryDate: '',
  imageUrl: '',
  description: '',
  requiresPrescription: false,
};

function toForm(medicine) {
  if (!medicine) return EMPTY;
  const values = { ...EMPTY };
  Object.keys(EMPTY).forEach((key) => {
    if (medicine[key] !== undefined && medicine[key] !== null) values[key] = medicine[key];
  });
  values.expiryDate = medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : '';
  return values;
}

// Used for both Create (no medicine) and Update (existing medicine)
export default function MedicineFormModal({ medicine, onClose, onSaved }) {
  const { categories, dosageForms } = useMeta();
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(medicine));
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(medicine);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };
  const invalid = (field) => (errors[field] ? 'invalid' : '');

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = validateMedicine(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setAlert('Please fix the errors below');
      return;
    }

    const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    setBusy(true);
    setAlert('');
    try {
      const res = isEdit
        ? await api(`/medicines/${medicine._id}`, { method: 'PUT', body })
        : await api('/medicines', { method: 'POST', body });
      toast(res.message, 'success');
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
      setAlert(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={isEdit ? `Edit ${medicine.name}` : 'Add medicine'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          <FormAlert message={alert} />
          <div className="form-row">
            <Field label="Name" name="name" error={errors.name} required>
              <input id="name" name="name" maxLength={100} value={form.name} onChange={change} className={invalid('name')} autoFocus />
            </Field>
            <Field label="Generic name" name="genericName" error={errors.genericName}>
              <input id="genericName" name="genericName" maxLength={100} value={form.genericName} onChange={change} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Category" name="category" error={errors.category} required>
              <select id="category" name="category" value={form.category} onChange={change} className={invalid('category')}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Dosage form" name="dosageForm" error={errors.dosageForm}>
              <select id="dosageForm" name="dosageForm" value={form.dosageForm} onChange={change}>
                {dosageForms.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Strength / size" name="strength" error={errors.strength}>
              <input id="strength" name="strength" maxLength={30} placeholder="e.g. 500mg" value={form.strength} onChange={change} />
            </Field>
            <Field label="Manufacturer" name="manufacturer" error={errors.manufacturer}>
              <input id="manufacturer" name="manufacturer" maxLength={100} value={form.manufacturer} onChange={change} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Price (Rs.)" name="price" error={errors.price} required>
              <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} className={invalid('price')} />
            </Field>
            <Field label="Stock quantity" name="stock" error={errors.stock} required>
              <input id="stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={change} className={invalid('stock')} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Expiry date" name="expiryDate" error={errors.expiryDate}>
              <input id="expiryDate" name="expiryDate" type="date" value={form.expiryDate} onChange={change} className={invalid('expiryDate')} />
            </Field>
            <Field label="Image URL" name="imageUrl" error={errors.imageUrl}>
              <input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." value={form.imageUrl} onChange={change} className={invalid('imageUrl')} />
            </Field>
          </div>
          <Field label="Description" name="description" error={errors.description}>
            <textarea id="description" name="description" maxLength={1000} value={form.description} onChange={change} />
          </Field>
          <label className="checkbox">
            <input type="checkbox" name="requiresPrescription" checked={form.requiresPrescription} onChange={change} /> Requires prescription
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving...' : isEdit ? 'Save changes' : 'Add medicine'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
