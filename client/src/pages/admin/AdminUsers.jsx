import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import { ConfirmDialog, EmptyState, Spinner } from '../../components/ui';
import { formatDate } from '../../utils/format';
import UserFormModal from './UserFormModal';

export default function AdminUsers() {
  const { user: me, updateUser } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [sort, setSort] = useState('newest');
  const debouncedSearch = useDebounce(search);

  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, user = edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ sort });
    if (role) params.set('role', role);
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

    let stale = false;
    setUsers(null);
    setError('');
    api(`/users?${params}`)
      .then(({ data }) => !stale && setUsers(data))
      .catch((err) => !stale && setError(err.message));
    return () => {
      stale = true;
    };
  }, [debouncedSearch, role, sort, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const res = await api(`/users/${deleting._id}`, { method: 'DELETE' });
      toast(res.message, 'success');
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
          <h1>User Accounts</h1>
          <p>Create, view, edit and remove customer and admin accounts.</p>
        </div>
        <button className="btn" onClick={() => setEditing({})}>
          + Add user
        </button>
      </div>

      <div className="toolbar">
        <input type="search" className="grow" placeholder="Search by name, email or phone..." aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort users">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
        {users && (
          <span className="result-count">
            {users.length} user{users.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Orders</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan={6} className="empty">{error}</td></tr>}
            {!error && !users && <tr><td colSpan={6}><Spinner /></td></tr>}
            {users && !users.length && (
              <tr><td colSpan={6}><EmptyState icon="👤"><p>No users found.</p></EmptyState></td></tr>
            )}
            {users?.map((u) => {
              const isSelf = u._id === me._id;
              return (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong> {isSelf && <span className="badge badge-gray">You</span>}
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{u.address || ''}</div>
                  </td>
                  <td>
                    {u.email}
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{u.phone || '-'}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>{u.role}</span>
                  </td>
                  <td>{u.orderCount}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-outline btn-sm" onClick={() => setEditing(u)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleting(u)} disabled={isSelf} title={isSelf ? 'You cannot delete your own account' : ''}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <UserFormModal
          user={editing._id ? editing : null}
          isSelf={editing._id === me._id}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            if (saved._id === me._id) updateUser(saved);
            setEditing(null);
            refresh();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete user?"
          message={`${deleting.name}'s account (${deleting.email}) will be permanently deleted. Their past orders stay in the system.`}
          confirmText="Delete"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
