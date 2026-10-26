import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import useMeta from '../../hooks/useMeta';
import { ConfirmDialog, EmptyState, Pagination, Spinner, StockBadge } from '../../components/ui';
import { formatDate, money } from '../../utils/format';
import MedicineFormModal from './MedicineFormModal';

function Stats({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const toast = useToast();

  useEffect(() => {
    api('/orders/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => toast(err.message, 'error'));
  }, [refreshKey, toast]);

  if (!stats) return null;
  const items = [
    ['Medicines', stats.medicines],
    ['Low stock', stats.lowStock],
    ['Pending orders', stats.orders.Pending, '/admin/orders?status=Pending'],
    ['Total orders', stats.totalOrders, '/admin/orders'],
    ['Customers', stats.customers, '/admin/users'],
    ['Revenue (completed)', money(stats.revenue), '/admin/orders?status=Completed'],
  ];
  return (
    <section className="stats">
      {items.map(([label, value, to]) => {
        const inner = (
          <>
            <div className="label">{label}</div>
            <div className="value">{value}</div>
          </>
        );
        return to ? (
          <Link key={label} className="stat" to={to} style={{ color: 'inherit', textDecoration: 'none' }}>
            {inner}
          </Link>
        ) : (
          <div key={label} className="stat">
            {inner}
          </div>
        );
      })}
    </section>
  );
}

export default function AdminMedicines() {
  const { categories } = useMeta();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, medicine = edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ sort, page, limit: 10 });
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (category) params.set('category', category);
    if (stockFilter === 'low') params.set('lowStock', 'true');
    if (stockFilter === 'in') params.set('inStock', 'true');

    // Ignore responses from requests that were replaced by a newer one
    let stale = false;
    setResult(null);
    setError('');
    api(`/medicines?${params}`)
      .then((data) => !stale && setResult(data))
      .catch((err) => !stale && setError(err.message));
    return () => {
      stale = true;
    };
  }, [debouncedSearch, category, stockFilter, sort, page, refreshKey]);

  // Go back to page 1 whenever the filters change
  useEffect(() => setPage(1), [debouncedSearch, category, stockFilter, sort]);

  // Open the edit form directly when coming from a medicine details page (?edit=id)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    api(`/medicines/${encodeURIComponent(editId)}`)
      .then(({ data }) => setEditing(data))
      .catch((err) => toast(err.message, 'error'));
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const toggleSort = (key) => setSort(sort === `${key}_asc` ? `${key}_desc` : `${key}_asc`);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const res = await api(`/medicines/${deleting._id}`, { method: 'DELETE' });
      toast(res.message, 'success');
      if (result.data.length === 1 && page > 1) setPage(page - 1);
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage the medicine catalogue and stock levels.</p>
        </div>
        <button className="btn" onClick={() => setEditing({})}>
          + Add medicine
        </button>
      </div>

      <Stats refreshKey={refreshKey} />

      <div className="toolbar">
        <input type="search" className="grow" placeholder="Search medicines..." aria-label="Search medicines" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} aria-label="Filter by stock">
          <option value="">All stock levels</option>
          <option value="low">Low stock (&lt; 10)</option>
          <option value="in">In stock</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort medicines">
          <option value="newest">Newest first</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="price_asc">Price (low to high)</option>
          <option value="price_desc">Price (high to low)</option>
          <option value="stock_asc">Stock (lowest first)</option>
          <option value="stock_desc">Stock (highest first)</option>
        </select>
        {result && (
          <span className="result-count">
            {result.total} result{result.total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('name')}>Medicine ↕</th>
              <th>Category</th>
              <th className="sortable" onClick={() => toggleSort('price')}>Price ↕</th>
              <th className="sortable" onClick={() => toggleSort('stock')}>Stock ↕</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr><td colSpan={6} className="empty">{error}</td></tr>
            )}
            {!error && !result && (
              <tr><td colSpan={6}><Spinner /></td></tr>
            )}
            {result && !result.data.length && (
              <tr><td colSpan={6}><EmptyState icon="💊"><p>No medicines found.</p></EmptyState></td></tr>
            )}
            {result?.data.map((m) => (
              <tr key={m._id}>
                <td>
                  <strong>
                    <Link to={`/medicines/${m._id}`}>
                      {m.name} {m.strength}
                    </Link>
                  </strong>{' '}
                  {m.requiresPrescription && <span className="badge badge-blue">Rx</span>}
                  <div className="muted" style={{ fontSize: '0.85rem' }}>{m.genericName}</div>
                </td>
                <td>{m.category}</td>
                <td>{money(m.price)}</td>
                <td>
                  {m.stock} {m.stock < 10 && <StockBadge stock={m.stock} />}
                </td>
                <td>{formatDate(m.expiryDate)}</td>
                <td>
                  <div className="actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(m)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleting(m)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result && <Pagination page={page} pages={result.pages} onChange={setPage} />}

      {editing && (
        <MedicineFormModal
          medicine={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete medicine?"
          message={`"${deleting.name} ${deleting.strength || ''}" will be permanently removed from the catalogue. Past orders keep their record.`}
          confirmText="Delete"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
