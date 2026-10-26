import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { EmptyState, Field, FormAlert } from '../components/ui';
import { money, shortId } from '../utils/format';
import { validateCheckout } from '../utils/validation';

export default function Cart() {
  const { user, isAdmin } = useAuth();
  const { items, count, total, setQuantity, removeItem, clear } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shippingAddress: user?.address || '',
    phone: user?.phone || '',
    paymentMethod: 'Cash on Delivery',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const changeQuantity = (item, value) => {
    let qty = parseInt(value, 10);
    if (!Number.isInteger(qty) || qty < 1) qty = 1;
    if (qty > item.stock) {
      qty = item.stock;
      toast(`Only ${item.stock} unit(s) of ${item.name} available`, 'error');
    }
    setQuantity(item._id, qty);
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    const clientErrors = validateCheckout(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setAlert('Please fix the errors below');
      return;
    }

    setBusy(true);
    setAlert('');
    try {
      const { data } = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ medicine: i._id, quantity: i.quantity })),
          shippingAddress: form.shippingAddress.trim(),
          phone: form.phone.trim(),
          paymentMethod: form.paymentMethod,
          notes: form.notes.trim(),
        },
      });
      clear();
      toast(`Order ${shortId(data._id)} placed successfully!`, 'success');
      navigate('/orders');
    } catch (err) {
      setErrors(fieldErrors(err));
      setAlert(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>Your Cart</h1>
          <p>Review your items and place your order.</p>
        </div>
      </div>

      {!items.length ? (
        <div className="card">
          <EmptyState icon="🛒">
            <p>Your cart is empty.</p>
            <Link className="btn" to="/">
              Browse medicines
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="card">
            {items.map((i) => (
              <div className="cart-item" key={i._id}>
                <div className="info">
                  <strong>
                    <Link to={`/medicines/${i._id}`}>
                      {i.name} {i.strength}
                    </Link>
                  </strong>{' '}
                  {i.requiresPrescription && <span className="badge badge-blue">Rx</span>}
                  <div className="muted">{money(i.price)} each</div>
                </div>
                <input
                  type="number"
                  min="1"
                  max={i.stock}
                  value={i.quantity}
                  aria-label={`Quantity for ${i.name}`}
                  onChange={(e) => changeQuantity(i, e.target.value)}
                />
                <strong style={{ minWidth: 100, textAlign: 'right' }}>{money(i.price * i.quantity)}</strong>
                <button className="btn btn-secondary btn-sm" onClick={() => removeItem(i._id)} aria-label={`Remove ${i.name}`}>
                  ✕
                </button>
              </div>
            ))}
          </section>

          <aside className="card">
            <h2 style={{ fontSize: '1.15rem' }}>Order summary</h2>
            <div className="summary-row"><span>Items</span><span>{count}</span></div>
            <div className="summary-row"><span>Delivery</span><span>Free</span></div>
            <div className="summary-row summary-total"><span>Total</span><span>{money(total)}</span></div>

            <form onSubmit={placeOrder} noValidate style={{ marginTop: 16 }}>
              <FormAlert message={alert} />
              {items.some((i) => i.requiresPrescription) && (
                <div className="alert alert-info">Your cart contains prescription medicines. Please keep your prescription ready for delivery.</div>
              )}
              <Field label="Delivery address" name="shippingAddress" error={errors.shippingAddress} required>
                <textarea id="shippingAddress" name="shippingAddress" maxLength={200} value={form.shippingAddress} onChange={change} className={errors.shippingAddress ? 'invalid' : ''} />
              </Field>
              <Field label="Phone number" name="phone" error={errors.phone} required>
                <input id="phone" name="phone" type="tel" placeholder="0771234567" value={form.phone} onChange={change} className={errors.phone ? 'invalid' : ''} />
              </Field>
              <Field label="Payment method" name="paymentMethod">
                <select id="paymentMethod" name="paymentMethod" value={form.paymentMethod} onChange={change}>
                  <option>Cash on Delivery</option>
                  <option>Card on Delivery</option>
                </select>
              </Field>
              <Field label="Notes (optional)" name="notes" error={errors.notes}>
                <input id="notes" name="notes" maxLength={300} placeholder="e.g. call before delivery" value={form.notes} onChange={change} />
              </Field>
              <button className="btn btn-block" type="submit" disabled={busy}>
                {busy ? 'Placing order...' : 'Place order'}
              </button>
              {!user && (
                <p className="muted" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                  You will be asked to <Link to="/login" state={{ from: '/cart' }}>log in</Link> before placing the order.
                </p>
              )}
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
