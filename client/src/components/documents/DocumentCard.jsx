import { motion } from 'framer-motion';
import { FileText, Trash2, Layers, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Card, Badge } from '../ui/Primitives';

const STATUS_CONFIG = {
  indexed: { icon: CheckCircle2, tone: 'verdigris', label: 'Indexed' },
  processing: { icon: Loader2, tone: 'brass', label: 'Processing' },
  pending: { icon: Loader2, tone: 'brass', label: 'Pending' },
  failed: { icon: XCircle, tone: 'oxblood', label: 'Failed' },
};

export default function DocumentCard({ document, onDelete, onSummarize }) {
  const config = STATUS_CONFIG[document.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
      <Card className="flex h-full flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-brass/12 text-brass-deep dark:text-brass-soft">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink dark:text-paper" title={document.displayName}>
              {document.displayName}
            </p>
            <p className="text-xs text-ink/45 dark:text-paper/45">
              {new Date(document.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge tone={config.tone}>
            <StatusIcon size={11} className={document.status === 'processing' ? 'animate-spin' : ''} />
            {config.label}
          </Badge>
          {document.chunkCount > 0 && (
            <Badge tone="neutral">
              <Layers size={11} /> {document.chunkCount} chunks
            </Badge>
          )}
        </div>

        {document.cachedSummary && (
          <p className="mt-3 line-clamp-3 text-xs text-ink/60 dark:text-paper/60">{document.cachedSummary}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3">
          <button
            onClick={() => onSummarize(document)}
            disabled={document.status !== 'indexed'}
            className="flex-1 rounded-card border border-ink/15 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-brass hover:text-brass-deep disabled:opacity-40 dark:border-paper/15 dark:text-paper/70 dark:hover:text-brass-soft"
          >
            Summarize
          </button>
          <button
            onClick={() => onDelete(document)}
            className="rounded-card border border-ink/15 p-1.5 text-ink/50 transition-colors hover:border-oxblood hover:text-oxblood dark:border-paper/15 dark:text-paper/50"
            aria-label="Delete document"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
