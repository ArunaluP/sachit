// Small reusable UI pieces shared across pages
import { useEffect, useState } from 'react';
import { CATEGORY_ICONS } from '../utils/format';

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

export function EmptyState({ icon, children }) {
  return (
    <div className="empty">
      <div className="icon">{icon}</div>
      {children}
    </div>
  );
}

export function Field({ label, name, error, required, children }) {
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      <div className="field-error">{error}</div>
    </div>
  );
}

export function FormAlert({ message }) {
  if (!message) return null;
  return <div className="alert alert-error">{message}</div>;
}

const STATUS_BADGES = { Pending: 'badge-yellow', Processing: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_BADGES[status] || 'badge-gray'}`}>{status}</span>;
}

export function StockBadge({ stock }) {
  if (stock <= 0) return <span className="badge badge-red">Out of stock</span>;
  if (stock < 10) return <span className="badge badge-yellow">Only {stock} left</span>;
  return <span className="badge badge-green">In stock</span>;
}

export function MedicineImage({ medicine }) {
  const [broken, setBroken] = useState(false);
  const icon = CATEGORY_ICONS[medicine.category] || '💊';
  if (!medicine.imageUrl || broken) return icon;
  return <img src={medicine.imageUrl} alt={medicine.name} onError={() => setBroken(true)} />;
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        ‹ Prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button key={p} className={`btn btn-sm ${p === page ? '' : 'btn-secondary'}`} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => onChange(page + 1)}>
        Next ›
      </button>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, small = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${small ? 'modal-sm' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title = 'Are you sure?', message, confirmText = 'Confirm', onConfirm, onCancel, busy }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      small
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Please wait...' : confirmText}
          </button>
        </>
      }
    >
      <div className="modal-body">
        <p style={{ margin: 0 }}>{message}</p>
      </div>
    </Modal>
  );
}
