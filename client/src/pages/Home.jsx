import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import useMeta from '../hooks/useMeta';
import { EmptyState, MedicineImage, Pagination, Spinner, StockBadge } from '../components/ui';
import { money } from '../utils/format';

export default function Home() {
  // Filters live in the URL so the page can be refreshed or shared
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounce(search);
  const { categories } = useMeta();
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const inStock = params.get('inStock') === 'true';
  const page = Number(params.get('page')) || 1;

  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debouncedSearch !== (params.get('q') || '')) updateParams({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const query = new URLSearchParams(params);
    query.set('limit', 12);
    let stale = false;
    setResult(null);
    setError('');
    api(`/medicines?${query}`)
      .then((data) => !stale && setResult(data))
      .catch((err) => !stale && setError(err.message));
    return () => {
      stale = true;
    };
  }, [params]);

  const resetFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  const handleAdd = (medicine) => {
    try {
      addItem(medicine, 1);
      toast(`${medicine.name} added to cart`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Your trusted online pharmacy</h1>
          <p>Search medicines, add them to your cart and get them delivered to your door.</p>
          <form className="search-bar" role="search" onSubmit={(e) => e.preventDefault()}>
            <input
              type="search"
              placeholder="Search by name, generic name or manufacturer..."
              aria-label="Search medicines"
              maxLength={100}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="container page">
        <div className="toolbar">
          <select value={category} onChange={(e) => updateParams({ category: e.target.value })} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })} aria-label="Sort medicines">
            <option value="newest">Newest first</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (low to high)</option>
            <option value="price_desc">Price (high to low)</option>
          </select>
          <input type="number" min="0" placeholder="Min price" aria-label="Minimum price" value={minPrice} onChange={(e) => updateParams({ minPrice: e.target.value })} />
          <input type="number" min="0" placeholder="Max price" aria-label="Maximum price" value={maxPrice} onChange={(e) => updateParams({ maxPrice: e.target.value })} />
          <label className="checkbox">
            <input type="checkbox" checked={inStock} onChange={(e) => updateParams({ inStock: e.target.checked ? 'true' : '' })} /> In stock only
          </label>
          <button className="btn btn-secondary btn-sm" type="button" onClick={resetFilters}>
            Reset
          </button>
          {result && (
            <span className="result-count">
              {result.total} medicine{result.total === 1 ? '' : 's'} found
            </span>
          )}
        </div>

        {error && <EmptyState icon="⚠️"><p>{error}</p></EmptyState>}
        {!error && !result && <Spinner />}
        {result && !result.data.length && (
          <EmptyState icon="🔍">
            <p>No medicines match your search.</p>
          </EmptyState>
        )}

        {result && result.data.length > 0 && (
          <div className="grid">
            {result.data.map((m) => (
              <article key={m._id} className="med-card">
                <Link className="med-img" to={`/medicines/${m._id}`}>
                  <MedicineImage medicine={m} />
                </Link>
                <div className="med-body">
                  <h3>
                    <Link to={`/medicines/${m._id}`}>
                      {m.name} {m.strength}
                    </Link>
                  </h3>
                  <div className="med-meta">{m.genericName || m.category}</div>
                  <div>
                    <StockBadge stock={m.stock} /> {m.requiresPrescription && <span className="badge badge-blue">Rx</span>}
                  </div>
                  <div className="med-footer">
                    <span className="price">{money(m.price)}</span>
                    {!isAdmin && (
                      <button className="btn btn-sm" disabled={m.stock <= 0} onClick={() => handleAdd(m)}>
                        Add to cart
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {result && (
          <Pagination
            page={page}
            pages={result.pages}
            onChange={(p) => {
              updateParams({ page: String(p) }, false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </section>
    </>
  );
}
