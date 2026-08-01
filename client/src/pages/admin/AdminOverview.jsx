import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileStack, MessagesSquare, ShieldCheck, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { adminApi } from '../../api/history.api';
import { useToast } from '../../context/ToastContext';
import { Card, Skeleton, Badge, EmptyState } from '../../components/ui/Primitives';
import AdminTabs from '../../components/layout/AdminTabs';

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <Card className="p-4">
      <Icon size={16} className="text-ink/40 dark:text-paper/40" />
      {loading ? <Skeleton className="mt-2 h-7 w-12" /> : <p className="mt-2 font-display text-2xl text-ink dark:text-paper">{value}</p>}
      <p className="text-xs text-ink/50 dark:text-paper/50">{label}</p>
    </Card>
  );
}

function summarizeStats(rawStats) {
  const byType = {};
  for (const row of rawStats || []) {
    const type = row._id?.type || 'unknown';
    if (!byType[type]) byType[type] = { total: 0, success: 0, failed: 0, avgDurationMs: 0, count: 0 };
    byType[type].total += row.count;
    byType[type][row._id?.status === 'success' ? 'success' : 'failed'] += row.count;
    byType[type].avgDurationMs += row.avgDurationMs * row.count;
    byType[type].count += row.count;
  }
  return Object.entries(byType).map(([type, s]) => ({
    type,
    total: s.total,
    success: s.success,
    failed: s.failed,
    avgDurationMs: Math.round(s.avgDurationMs / s.count),
  }));
}

export default function AdminOverview() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getOverview()
      .then(({ data }) => setOverview(data.data))
      .catch(() => toast.error('Could not load the admin overview.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const health = overview?.aiServiceHealth;
  const stats = summarizeStats(overview?.aiRequestStats);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-10">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-verdigris" />
        <h1 className="font-display text-2xl text-ink dark:text-paper md:text-3xl">Admin overview</h1>
      </div>
      <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">System-wide stats and AI service health.</p>
      <div className="mt-5">
        <AdminTabs />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={overview?.totals.users} loading={loading} />
        <StatCard icon={ShieldCheck} label="Admins" value={overview?.totals.admins} loading={loading} />
        <StatCard icon={FileStack} label="Documents" value={overview?.totals.documents} loading={loading} />
        <StatCard icon={MessagesSquare} label="Conversations" value={overview?.totals.sessions} loading={loading} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base text-ink dark:text-paper">
            <Activity size={16} /> AI service health
          </h2>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge tone={health?.status === 'ok' ? 'verdigris' : health?.status === 'degraded' ? 'brass' : 'oxblood'}>
                  {health?.status || 'unknown'}
                </Badge>
                {health?.version && <span className="text-xs text-ink/45 dark:text-paper/45">v{health.version}</span>}
              </div>
              <ul className="mt-3 space-y-1.5">
                {(health?.dependencies || []).map((dep) => (
                  <li key={dep.name} className="flex items-center justify-between text-xs">
                    <span className="text-ink/60 dark:text-paper/60">{dep.name}</span>
                    <span
                      className={
                        dep.status === 'ok' ? 'text-verdigris' : dep.status === 'degraded' ? 'text-brass' : 'text-oxblood'
                      }
                    >
                      {dep.status}
                    </span>
                  </li>
                ))}
              </ul>
              {!health?.dependencies && <p className="text-xs text-oxblood">{health?.detail}</p>}
            </>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-base text-ink dark:text-paper">AI requests (last 7 days)</h2>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats.length === 0 ? (
            <p className="text-sm text-ink/45 dark:text-paper/45">No requests yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ink/40 dark:text-paper/40">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Success</th>
                  <th className="pb-2 font-medium">Failed</th>
                  <th className="pb-2 font-medium">Avg ms</th>
                </tr>
              </thead>
              <tbody className="text-ink/75 dark:text-paper/75">
                {stats.map((s) => (
                  <tr key={s.type} className="border-t border-ink/8 dark:border-paper/8">
                    <td className="py-2 capitalize">{s.type.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-verdigris">{s.success}</td>
                    <td className="py-2 text-oxblood">{s.failed || 0}</td>
                    <td className="py-2">{s.avgDurationMs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base text-ink dark:text-paper">
            <AlertTriangle size={16} /> Recent error logs
          </h2>
          <Link to="/admin/logs" className="flex items-center gap-1 text-xs font-medium text-brass hover:underline">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : !overview?.recentErrorLogs?.length ? (
          <Card className="p-6">
            <EmptyState icon={AlertTriangle} title="No errors logged" description="The system has been running cleanly." />
          </Card>
        ) : (
          <Card className="divide-y divide-ink/8 dark:divide-paper/8">
            {overview.recentErrorLogs.map((log) => (
              <div key={log._id} className="px-4 py-3">
                <p className="truncate text-sm text-oxblood">{log.message}</p>
                <p className="text-xs text-ink/40 dark:text-paper/40">
                  {log.method} {log.path} · {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
