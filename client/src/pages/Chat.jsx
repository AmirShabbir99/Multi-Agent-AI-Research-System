import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessagesSquare, PanelLeftOpen, PanelLeftClose, Sparkles } from 'lucide-react';
import { sessionApi } from '../api/session.api';
import { useToast } from '../context/ToastContext';
import SessionSidebar from '../components/chat/SessionSidebar';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { EmptyState, Spinner } from '../components/ui/Primitives';
import Button from '../components/ui/Button';

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await sessionApi.list({ limit: 50 });
      setSessions(data.data);
    } catch {
      toast.error('Could not load your conversations.');
    } finally {
      setSessionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    sessionApi
      .getMessages(sessionId, { limit: 100 })
      .then(({ data }) => setMessages(data.data))
      .catch(() => toast.error('Could not load this conversation.'))
      .finally(() => setMessagesLoading(false));
  }, [sessionId, toast]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const handleCreate = async () => {
    try {
      const { data } = await sessionApi.create({});
      setSessions((prev) => [data.data, ...prev]);
      navigate(`/chat/${data.data._id}`);
      setSidebarOpen(false);
    } catch {
      toast.error('Could not start a new conversation.');
    }
  };

  const handleArchive = async (id) => {
    try {
      await sessionApi.archive(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      toast.success('Conversation archived.');
      if (id === sessionId) navigate('/chat');
    } catch {
      toast.error('Could not archive conversation.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this conversation permanently? This cannot be undone.')) return;
    try {
      await sessionApi.remove(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      toast.success('Conversation deleted.');
      if (id === sessionId) navigate('/chat');
    } catch {
      toast.error('Could not delete conversation.');
    }
  };

  const handleSend = async ({ message, mode, allowWebSearch }) => {
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      try {
        const { data } = await sessionApi.create({});
        activeSessionId = data.data._id;
        setSessions((prev) => [data.data, ...prev]);
        navigate(`/chat/${activeSessionId}`, { replace: true });
      } catch {
        toast.error('Could not start a new conversation.');
        return;
      }
    }

    const optimisticUser = { _id: `temp-${Date.now()}`, role: 'user', content: message, mode, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimisticUser]);
    setSending(true);

    try {
      const { data } = await sessionApi.sendMessage(activeSessionId, { message, mode, allowWebSearch });
      setMessages((prev) => [...prev, data.data.assistantMessage]);
      setSessions((prev) =>
        prev
          .map((s) => (s._id === activeSessionId ? { ...s, lastMessageAt: new Date().toISOString(), messageCount: s.messageCount + 2 } : s))
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'The assistant could not respond. Please try again.');
      setMessages((prev) => prev.filter((m) => m._id !== optimisticUser._id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Session list - desktop */}
      <div className="hidden w-72 shrink-0 md:block">
        <SessionSidebar
          sessions={sessions}
          loading={sessionsLoading}
          activeId={sessionId}
          onCreate={handleCreate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      </div>

      {/* Session list - mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSidebarOpen(false)} />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="relative z-10 h-full w-72 bg-paper dark:bg-ink"
          >
            <SessionSidebar
              sessions={sessions}
              loading={sessionsLoading}
              activeId={sessionId}
              onCreate={handleCreate}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </motion.div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-2.5 dark:border-paper/10 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-card p-1.5 text-ink/60 hover:bg-ink/5 dark:text-paper/60">
            <PanelLeftOpen size={17} />
          </button>
          <p className="truncate text-sm font-medium">{sessions.find((s) => s._id === sessionId)?.title || 'Conversations'}</p>
        </div>

        {!sessionId ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <EmptyState
              icon={Sparkles}
              title="Ask ResearchMind anything"
              description="Get quick, grounded answers from your documents and the web - or request a full research report with citations and a critique."
              action={
                <Button size="sm" onClick={handleCreate} className="mt-1">
                  Start a conversation
                </Button>
              }
            />
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messagesLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : messages.length === 0 ? (
                <EmptyState icon={MessagesSquare} title="Say hello" description="Ask a question to get started." />
              ) : (
                messages.map((m) => <MessageBubble key={m._id} message={m} />)
              )}
              {sending && (
                <div className="flex items-center gap-2 px-1 text-xs text-ink/45 dark:text-paper/45">
                  <Spinner size={14} /> Thinking...
                </div>
              )}
            </div>
          </div>
        )}

        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}
