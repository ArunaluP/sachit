import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import { ConfirmDialog, EmptyState, Modal, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, money, shortId } from '../../utils/format';

// Must match STATUS_TRANSITIONS on the server
const NEXT_STATUSES = {
  Pending: ['Processing', 'Completed', 'Cancelled'],
  Processing: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const DELETED_USER = { name: 'Deleted user', email: '-', phone: '-' };

function OrderDetails({ order, onClose }) {
  const customer = order.user || DELETED_USER;
  return (
    <Modal
      title={`Order ${shortId(order._id)}`}
      onClose={onClose}
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      <div className="modal-body">
        <p>
          <StatusBadge status={order.status} /> <span className="muted">Placed {formatDate(order.createdAt, true)}</span>
        </p>
        <table className="detail-table">
          <tbody>
            <tr><th>Customer</th><td>{customer.name} ({customer.email})</td></tr>
            <tr><th>Phone</th><td>{order.phone}</td></tr>
            <tr><th>Delivery address</th><td>{order.shippingAddress}</td></tr>
            <tr><th>Payment</th><td>{order.paymentMethod}</td></tr>
            <tr><th>Notes</th><td>{order.notes || '-'}</td></tr>
            <tr><th>Last updated</th><td>{formatDate(order.updatedAt, true)}</td></tr>
          </tbody>
        </table>
        <ul className="order-items">
          {order.items.map((i) => (
            <li key={i.medicine}>
              <span>{i.name} × {i.quantity} @ {money(i.price)}</span>
              <span>{money(i.price * i.quantity)}</span>
            </li>
          ))}
          <li><strong>Total</strong><strong>{money(order.totalAmount)}</strong></li>
        </ul>
      </div>
    </Modal>
  );
}

export default function AdminOrders() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sort, setSort] = useState('newest');
  const debouncedSearch = useDebounce(search);

  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ sort });
    if (status) params.set('status', status);
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

    let stale = false;
    setOrders(null);
    setError('');
    api(`/orders?${params}`)
      .then(({ data }) => !stale && setOrders(data))
      .catch((err) => !stale && setError(err.message));
    return () => {
      stale = true;
    };
  }, [debouncedSearch, status, sort, refreshKey]);

  const updateStatus = async (order, nextStatus) => {
    setUpdatingId(order._id);
    try {
      const res = await api(`/orders/${order._id}/status`, { method: 'PATCH', body: { status: nextStatus } });
      toast(res.message, 'success');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUpdatingId(null);
      setPendingCancel(null);
    }
  };

  const onStatusSelect = (order, nextStatus) => {
    if (!nextStatus) return;
    // Cancelling returns stock, so ask first
    if (nextStatus === 'Cancelled') setPendingCancel(order);
    else updateStatus(order, nextStatus);
  };

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>Customer Orders</h1>
          <p>View orders and update their status.</p>
        </div>
      </div>

      <div className="toolbar">
        <input type="search" className="grow" placeholder="Search by customer name, email or phone..." aria-label="Search orders" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort orders">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total_desc">Total (high to low)</option>
          <option value="total_asc">Total (low to high)</option>
        </select>
        {orders && (
          <span className="result-count">
            {orders.length} order{orders.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan={6} className="empty">{error}</td></tr>}
            {!error && !orders && <tr><td colSpan={6}><Spinner /></td></tr>}
            {orders && !orders.length && (
              <tr><td colSpan={6}><EmptyState icon="📦"><p>No orders found.</p></EmptyState></td></tr>
            )}
            {orders?.map((o) => {
              const customer = o.user || DELETED_USER;
              const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0);
              const next = NEXT_STATUSES[o.status];
              return (
                <tr key={o._id}>
                  <td>
                    <strong>{shortId(o._id)}</strong>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{formatDate(o.createdAt, true)}</div>
                  </td>
                  <td>
                    {customer.name}
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{customer.email}</div>
                  </td>
                  <td>{itemCount} item{itemCount === 1 ? '' : 's'}</td>
                  <td><strong>{money(o.totalAmount)}</strong></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setViewing(o)}>View</button>
                      {next.length > 0 && (
                        <select
                          value=""
                          disabled={updatingId === o._id}
                          onChange={(e) => onStatusSelect(o, e.target.value)}
                          aria-label="Change status"
                          style={{ width: 'auto', padding: '5px 8px' }}
                        >
                          <option value="">Change status...</option>
                          {next.map((s) => (
                            <option key={s} value={s}>Mark as {s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewing && <OrderDetails order={viewing} onClose={() => setViewing(null)} />}

      {pendingCancel && (
        <ConfirmDialog
          title="Cancel this order?"
          message={`Order ${shortId(pendingCancel._id)} will be cancelled and its items returned to stock.`}
          confirmText="Cancel order"
          busy={updatingId === pendingCancel._id}
          onConfirm={() => updateStatus(pendingCancel, 'Cancelled')}
          onCancel={() => setPendingCancel(null)}
        />
      )}
    </div>
  );
}
