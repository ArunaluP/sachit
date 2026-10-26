import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog, EmptyState, Spinner, StatusBadge } from '../components/ui';
import { formatDate, money, shortId } from '../utils/format';

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    setOrders(null);
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    api(`/orders/my${query}`)
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(err.message));
  }, [status]);

  useEffect(load, [load]);

  const cancelOrder = async () => {
    setBusy(true);
    try {
      await api(`/orders/${cancelling._id}/cancel`, { method: 'PATCH' });
      toast('Order cancelled', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      setCancelling(null);
    }
  };

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>My Orders</h1>
          <p>Track your orders and their delivery status.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" style={{ width: 'auto' }}>
          <option value="">All orders</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </div>

      {error && <EmptyState icon="⚠️"><p>{error}</p></EmptyState>}
      {!error && !orders && <Spinner />}
      {orders && !orders.length && (
        <div className="card">
          <EmptyState icon="📦">
            <p>No orders found.</p>
            <Link className="btn" to="/">
              Start shopping
            </Link>
          </EmptyState>
        </div>
      )}

      {orders?.map((o) => (
        <article className="card order-card" key={o._id}>
          <div className="order-head">
            <div>
              <strong>Order {shortId(o._id)}</strong>
              <div className="muted" style={{ fontSize: '0.88rem' }}>
                {formatDate(o.createdAt, true)} · {o.paymentMethod}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <StatusBadge status={o.status} />
              <strong>{money(o.totalAmount)}</strong>
              {o.status === 'Pending' && (
                <button className="btn btn-secondary btn-sm" onClick={() => setCancelling(o)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
          <ul className="order-items">
            {o.items.map((i) => (
              <li key={i.medicine}>
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ margin: '10px 0 0', fontSize: '0.88rem' }}>
            Deliver to: {o.shippingAddress} · {o.phone}
          </p>
        </article>
      ))}

      {cancelling && (
        <ConfirmDialog
          title="Cancel order?"
          message={`Order ${shortId(cancelling._id)} will be cancelled and cannot be restored.`}
          confirmText="Cancel order"
          busy={busy}
          onConfirm={cancelOrder}
          onCancel={() => setCancelling(null)}
        />
      )}
    </div>
  );
}
