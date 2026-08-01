import { useEffect, useState } from 'react';
import { Search, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, Users as UsersIcon } from 'lucide-react';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, Skeleton, Badge, EmptyState } from '../../components/ui/Primitives';
import AdminTabs from '../../components/layout/AdminTabs';
import Button from '../../components/ui/Button';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    setLoading(true);
    userApi
      .list({ page, limit: 20, search: search || undefined })
      .then(({ data }) => {
        setUsers(data.data);
        setPages(data.meta.pages);
      })
      .catch(() => toast.error('Could not load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleRole = async (u) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    if (u._id === currentUser._id) {
      toast.error("You can't change your own role.");
      return;
    }
    if (!window.confirm(`Change ${u.name}'s role to "${nextRole}"?`)) return;
    try {
      const { data } = await userApi.setRole(u._id, nextRole);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? data.data : x)));
      toast.success(`${u.name} is now a${nextRole === 'admin' ? 'n' : ''} ${nextRole}.`);
    } catch {
      toast.error('Could not update role.');
    }
  };

  const toggleStatus = async (u) => {
    if (u._id === currentUser._id) {
      toast.error("You can't deactivate your own account.");
      return;
    }
    try {
      const { data } = await userApi.setActiveStatus(u._id, !u.isActive);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? data.data : x)));
      toast.success(`${u.name} ${data.data.isActive ? 'activated' : 'deactivated'}.`);
    } catch {
      toast.error('Could not update status.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="font-display text-2xl text-ink dark:text-paper md:text-3xl">Users</h1>
      <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">Manage roles and account status.</p>
      <div className="mt-5">
        <AdminTabs />
      </div>

      <form onSubmit={handleSearch} className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-paper/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-card border border-ink/15 bg-surface-light py-2 pl-9 pr-3 text-sm focus:border-brass focus:outline-none dark:border-paper/15 dark:bg-surface-darkRaised"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card className="p-6">
            <EmptyState icon={UsersIcon} title="No users found" description="Try a different search." />
          </Card>
        ) : (
          <Card className="divide-y divide-ink/8 dark:divide-paper/8">
            {users.map((u) => (
              <div key={u._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass/15 font-display text-sm text-brass-deep dark:text-brass-soft">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink dark:text-paper">{u.name}</p>
                    <p className="truncate text-xs text-ink/45 dark:text-paper/45">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={u.isActive ? 'verdigris' : 'oxblood'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Badge tone={u.role === 'admin' ? 'brass' : 'neutral'}>{u.role}</Badge>
                  <button
                    onClick={() => toggleRole(u)}
                    title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                    className="rounded-card border border-ink/15 p-1.5 text-ink/50 hover:border-brass hover:text-brass-deep dark:border-paper/15 dark:text-paper/50"
                  >
                    <ShieldCheck size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    title={u.isActive ? 'Deactivate' : 'Activate'}
                    className="rounded-card border border-ink/15 p-1.5 text-ink/50 hover:border-oxblood hover:text-oxblood dark:border-paper/15 dark:text-paper/50"
                  >
                    <ShieldOff size={14} />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={15} /> Prev
          </Button>
          <span className="text-xs text-ink/45 dark:text-paper/45">
            Page {page} of {pages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}
