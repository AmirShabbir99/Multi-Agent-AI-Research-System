import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessagesSquare, FileStack, Sparkles, Clock, ArrowRight, Plus, Upload } from 'lucide-react';
import { sessionApi } from '../api/session.api';
import { documentApi } from '../api/document.api';
import { historyApi } from '../api/history.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, Skeleton, EmptyState } from '../components/ui/Primitives';
import Button from '../components/ui/Button';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [sessionsRes, documentsRes, historyRes] = await Promise.all([
          sessionApi.list({ limit: 5 }),
          documentApi.list({ limit: 100 }),
          historyApi.list({ limit: 6 }),
        ]);
        setSessions(sessionsRes.data.data);
        setDocuments(documentsRes.data.data);
        setActivity(historyRes.data.data);
      } catch {
        toast.error('Could not load your dashboard. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewChat = async () => {
    try {
      const { data } = await sessionApi.create({});
      navigate(`/chat/${data.data._id}`);
    } catch {
      toast.error('Could not start a new conversation.');
    }
  };

  const indexedCount = documents.filter((d) => d.status === 'indexed').length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-brass">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl text-ink dark:text-paper md:text-4xl">{user?.name?.split(' ')[0]}</h1>
        <p className="mt-2 max-w-lg text-sm text-ink/55 dark:text-paper/55">
          Ask a question, run a deep research report, or pick up a saved conversation.
        </p>
      </motion.div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button onClick={startNewChat} className="text-left">
          <Card className="group flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-card bg-brass/15 text-brass-deep dark:text-brass-soft">
                <MessagesSquare size={20} />
              </div>
              <div>
                <p className="font-medium text-ink dark:text-paper">Start a conversation</p>
                <p className="text-xs text-ink/50 dark:text-paper/50">Quick answer or deep research</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-ink/30 transition-transform group-hover:translate-x-0.5 dark:text-paper/30" />
          </Card>
        </button>

        <Link to="/documents">
          <Card className="group flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-card bg-verdigris/15 text-verdigris-deep dark:text-verdigris-soft">
                <Upload size={20} />
              </div>
              <div>
                <p className="font-medium text-ink dark:text-paper">Upload a document</p>
                <p className="text-xs text-ink/50 dark:text-paper/50">PDF, DOCX, TXT or Markdown</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-ink/30 transition-transform group-hover:translate-x-0.5 dark:text-paper/30" />
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Conversations', value: sessions.length ? undefined : 0, icon: MessagesSquare },
          { label: 'Documents indexed', value: indexedCount, icon: FileStack },
          { label: 'Recent activity', value: activity.length, icon: Sparkles },
        ].map(({ label, icon: Icon }, i) => (
          <Card key={label} className="p-4">
            <Icon size={16} className="text-ink/40 dark:text-paper/40" />
            <p className="mt-2 font-display text-2xl text-ink dark:text-paper">
              {loading ? <Skeleton className="h-7 w-10" /> : i === 0 ? sessions.length : i === 1 ? indexedCount : activity.length}
            </p>
            <p className="text-xs text-ink/50 dark:text-paper/50">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent conversations */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink dark:text-paper">Recent conversations</h2>
            <Link to="/chat" className="text-xs font-medium text-brass hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={MessagesSquare}
                title="No conversations yet"
                description="Start one to ask questions or run a research report."
                action={
                  <Button size="sm" onClick={startNewChat} className="mt-1">
                    <Plus size={15} /> New conversation
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <Link key={s._id} to={`/chat/${s._id}`}>
                  <Card className="flex items-center justify-between p-4 transition-colors hover:border-brass/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink dark:text-paper">{s.title}</p>
                      <p className="text-xs text-ink/45 dark:text-paper/45">{s.messageCount} messages</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink/40 dark:text-paper/40">{timeAgo(s.lastMessageAt)}</span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink dark:text-paper">Recent activity</h2>
            <Link to="/history" className="text-xs font-medium text-brass hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activity.length === 0 ? (
            <Card className="p-6">
              <EmptyState icon={Clock} title="No activity yet" description="Your actions will show up here." />
            </Card>
          ) : (
            <Card className="divide-y divide-ink/8 dark:divide-paper/8">
              {activity.map((a) => (
                <div key={a._id} className="flex items-center justify-between px-4 py-3">
                  <p className="truncate text-sm text-ink/80 dark:text-paper/80">{a.description}</p>
                  <span className="shrink-0 pl-3 text-xs text-ink/40 dark:text-paper/40">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
