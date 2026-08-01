import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { adminApi } from '../../api/history.api';
import { useToast } from '../../context/ToastContext';
import { Card, Skeleton, Badge, EmptyState } from '../../components/ui/Primitives';
import AdminTabs from '../../components/layout/AdminTabs';
import Button from '../../components/ui/Button';

const TABS = [
  { id: 'errors', label: 'Error logs', icon: AlertTriangle },
  { id: 'ai-requests', label: 'AI requests', icon: Activity },
];

export default function AdminLogs() {
  const toast = useToast();
  const [tab, setTab] = useState('errors');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const fetcher = tab === 'errors' ? adminApi.listErrorLogs({ page: 1, limit: 30 }) : adminApi.listAiRequests({ page: 1, limit: 30 });
    fetcher
      .then(({ data }) => {
        setItems(data.data);
        setPages(data.meta.pages);
      })
      .catch(() => toast.error('Could not load logs.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (page === 1) return;
    setLoading(true);
    const fetcher = tab === 'errors' ? adminApi.listErrorLogs({ page, limit: 30 }) : adminApi.listAiRequests({ page, limit: 30 });
    fetcher
      .then(({ data }) => {
        setItems(data.data);
        setPages(data.meta.pages);
      })
      .catch(() => toast.error('Could not load logs.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="font-display text-2xl text-ink dark:text-paper md:text-3xl">Logs</h1>
      <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">System error logs and AI request history.</p>
      <div className="mt-5">
        <AdminTabs />
      </div>

      <div className="mt-5 flex gap-1 rounded-full border border-ink/12 p-0.5 dark:border-paper/12" style={{ width: 'fit-content' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              tab === id ? 'bg-ink text-paper dark:bg-brass dark:text-ink' : 'text-ink/50 dark:text-paper/50'
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-6">
            <EmptyState icon={tab === 'errors' ? AlertTriangle : Activity} title="Nothing here" description="No records to show yet." />
          </Card>
        ) : tab === 'errors' ? (
          <Card className="divide-y divide-ink/8 dark:divide-paper/8">
            {items.map((log) => (
              <div key={log._id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-oxblood">{log.message}</p>
                  <span className="shrink-0 text-xs text-ink/40 dark:text-paper/40">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink/45 dark:text-paper/45">
                  {log.method} {log.path} {log.statusCode ? `· ${log.statusCode}` : ''}
                </p>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/8 text-left text-ink/40 dark:border-paper/8 dark:text-paper/40">
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Endpoint</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Duration</th>
                  <th className="px-4 py-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {items.map((req) => (
                  <tr key={req._id} className="border-b border-ink/8 last:border-0 dark:border-paper/8">
                    <td className="px-4 py-2.5 capitalize text-ink/80 dark:text-paper/80">{req.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 font-mono text-ink/60 dark:text-paper/60">{req.endpoint}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={req.status === 'success' ? 'verdigris' : 'oxblood'}>{req.statusCode}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-ink/60 dark:text-paper/60">{req.durationMs}ms</td>
                    <td className="px-4 py-2.5 text-ink/45 dark:text-paper/45">{new Date(req.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
