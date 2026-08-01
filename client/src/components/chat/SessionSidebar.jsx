import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Archive, Trash2, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import { Skeleton, EmptyState } from '../ui/Primitives';
import { MessagesSquare } from 'lucide-react';

export default function SessionSidebar({ sessions, loading, activeId, onCreate, onArchive, onDelete }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className="flex h-full w-full flex-col border-r border-ink/10 dark:border-paper/10">
      <div className="p-3">
        <button
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-ink/20 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-brass hover:text-brass-deep dark:border-paper/20 dark:text-paper/70 dark:hover:text-brass-soft"
        >
          <Plus size={15} /> New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-2 px-1">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-2 py-6">
            <EmptyState icon={MessagesSquare} title="No conversations" description="Start your first one above." />
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((s) => (
              <li key={s._id} className="group relative">
                <NavLink
                  to={`/chat/${s._id}`}
                  className={clsx(
                    'block rounded-card px-3 py-2.5 pr-8 transition-colors',
                    activeId === s._id
                      ? 'bg-brass/15 text-brass-deep dark:text-brass-soft'
                      : 'text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/5'
                  )}
                >
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="truncate text-xs opacity-55">{s.messageCount} messages</p>
                </NavLink>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenuId(openMenuId === s._id ? null : s._id);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/30 opacity-0 hover:bg-ink/10 group-hover:opacity-100 dark:text-paper/30 dark:hover:bg-paper/10"
                >
                  <MoreVertical size={14} />
                </button>
                {openMenuId === s._id && (
                  <div className="absolute right-1 top-9 z-20 w-36 rounded-card border border-ink/10 bg-surface-light py-1 shadow-soft dark:border-paper/10 dark:bg-surface-darkRaised">
                    <button
                      onClick={() => {
                        onArchive(s._id);
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/5"
                    >
                      <Archive size={12} /> Archive
                    </button>
                    <button
                      onClick={() => {
                        onDelete(s._id);
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-oxblood hover:bg-oxblood/5"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
