import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  MessageCircle,
  Sparkles,
  Search,
  FileSignature,
  Trash2,
  RefreshCw,
  LogIn,
  UserPlus,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { historyApi } from '../api/history.api';
import { useToast } from '../context/ToastContext';
import { Card, Skeleton, EmptyState } from '../components/ui/Primitives';
import Button from '../components/ui/Button';

const ACTION_ICONS = {
  upload: Upload,
  ask: Sparkles,
  chat: MessageCircle,
  search: Search,
  summarize: FileSignature,
  delete_document: Trash2,
  rebuild_vector_db: RefreshCw,
  login: LogIn,
  register: UserPlus,
};

const ACTION_TONES = {
  upload: 'text-brass',
  ask: 'text-verdigris',
  chat: 'text-verdigris',
  search: 'text-brass',
  summarize: 'text-brass',
  delete_document: 'text-oxblood',
  rebuild_vector_db: 'text-ink/60 dark:text-paper/60',
  login: 'text-ink/60 dark:text-paper/60',
  register: 'text-ink/60 dark:text-paper/60',
};

export default function History() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    historyApi
      .list({ page, limit: 25 })
      .then(({ data }) => {
        setEntries(data.data);
        setPages(data.meta.pages);
      })
      .catch(() => toast.error('Could not load activity history.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="font-display text-2xl text-ink dark:text-paper md:text-3xl">Activity</h1>
      <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">Everything you've done across conversations and documents.</p>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card className="p-6">
            <EmptyState icon={Clock} title="No activity yet" description="Actions you take will show up here." />
          </Card>
        ) : (
          <Card className="divide-y divide-ink/8 dark:divide-paper/8">
            {entries.map((entry) => {
              const Icon = ACTION_ICONS[entry.action] || Clock;
              const content = (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 dark:bg-paper/5 ${ACTION_TONES[entry.action] || ''}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink/85 dark:text-paper/85">{entry.description}</p>
                    <p className="text-xs text-ink/40 dark:text-paper/40">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
              return entry.session ? (
                <Link key={entry._id} to={`/chat/${entry.session}`} className="block transition-colors hover:bg-ink/[0.02] dark:hover:bg-paper/[0.02]">
                  {content}
                </Link>
              ) : (
                <div key={entry._id}>{content}</div>
              );
            })}
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
