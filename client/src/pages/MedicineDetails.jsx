import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { EmptyState, MedicineImage, Spinner, StockBadge } from '../components/ui';
import { formatDate, money } from '../utils/format';

export default function MedicineDetails() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    api(`/medicines/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        setMedicine(data);
        document.title = `${data.name} | MediCare Pharmacy`;
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const handleAdd = (e) => {
    e.preventDefault();
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast('Please enter a valid quantity', 'error');
      return;
    }
    try {
      addItem(medicine, quantity);
      toast(`${quantity} × ${medicine.name} added to cart`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="container page">
      <p>
        <Link to="/">← Back to medicines</Link>
      </p>
      {error && <EmptyState icon="⚠️"><p>{error}</p></EmptyState>}
      {!error && !medicine && <Spinner />}
      {medicine && (
        <div className="detail card">
          <div className="med-img">
            <MedicineImage medicine={medicine} />
          </div>
          <div>
            <span className="badge badge-gray">{medicine.category}</span>
            <h1 style={{ marginTop: 8 }}>
              {medicine.name} {medicine.strength}
            </h1>
            <p className="price" style={{ fontSize: '1.5rem', margin: '4px 0' }}>
              {money(medicine.price)}
            </p>
            <div>
              <StockBadge stock={medicine.stock} />{' '}
              {medicine.requiresPrescription && <span className="badge badge-blue">Prescription required</span>}
            </div>
            <p>{medicine.description || 'No description available.'}</p>

            <table className="detail-table">
              <tbody>
                <tr><th>Generic name</th><td>{medicine.genericName || '-'}</td></tr>
                <tr><th>Dosage form</th><td>{medicine.dosageForm || '-'}</td></tr>
                <tr><th>Manufacturer</th><td>{medicine.manufacturer || '-'}</td></tr>
                <tr><th>Expiry date</th><td>{formatDate(medicine.expiryDate)}</td></tr>
                <tr><th>Available</th><td>{medicine.stock} unit(s)</td></tr>
              </tbody>
            </table>

            {medicine.requiresPrescription && (
              <div className="alert alert-info">This medicine needs a valid prescription. Please show it to the delivery person.</div>
            )}

            {isAdmin ? (
              <Link className="btn btn-outline" to={`/admin?edit=${medicine._id}`}>
                Edit this medicine
              </Link>
            ) : (
              <form className="qty-row" onSubmit={handleAdd} noValidate>
                <input
                  type="number"
                  aria-label="Quantity"
                  min="1"
                  max={medicine.stock}
                  value={qty}
                  disabled={medicine.stock <= 0}
                  onChange={(e) => setQty(e.target.value)}
                />
                <button className="btn" type="submit" disabled={medicine.stock <= 0}>
                  Add to cart
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
