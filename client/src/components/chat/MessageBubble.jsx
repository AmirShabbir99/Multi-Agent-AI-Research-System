import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { ChevronDown, FileText, Globe, Sparkles, Wrench, BadgeCheck } from 'lucide-react';
import { parseCritique } from '../../utils/parseCritique';
import { Badge } from '../ui/Primitives';

function ScoreStamp({ score }) {
  if (score == null) return null;
  const tone = score >= 8 ? 'verdigris' : score >= 5 ? 'brass' : 'oxblood';
  const toneClasses = {
    verdigris: 'border-verdigris text-verdigris-deep dark:text-verdigris-soft',
    brass: 'border-brass text-brass-deep dark:text-brass-soft',
    oxblood: 'border-oxblood text-oxblood',
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.4, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-[3px] font-display ${toneClasses[tone]}`}
    >
      <span className="text-xl leading-none">{score}</span>
      <span className="text-[9px] uppercase tracking-wide opacity-70">/ 10</span>
    </motion.div>
  );
}

function CritiquePanel({ critique }) {
  const parsed = parseCritique(critique);
  if (!parsed) return null;

  return (
    <div className="mt-4 rounded-card border border-oxblood/20 bg-oxblood/[0.04] p-4">
      <div className="flex items-start gap-4">
        <ScoreStamp score={parsed.score} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm text-ink dark:text-paper">Critic's review</p>
          {parsed.verdict && <p className="mt-0.5 text-sm italic text-ink/70 dark:text-paper/70">"{parsed.verdict}"</p>}
        </div>
      </div>
      {(parsed.strengths.length > 0 || parsed.improvements.length > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {parsed.strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-verdigris">Strengths</p>
              <ul className="space-y-1 text-xs text-ink/70 dark:text-paper/70">
                {parsed.strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {parsed.improvements.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-oxblood">To improve</p>
              <ul className="space-y-1 text-xs text-ink/70 dark:text-paper/70">
                {parsed.improvements.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollapsibleRaw({ label, content }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;
  return (
    <div className="mt-2 border-t border-ink/8 pt-2 dark:border-paper/8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-ink/80 dark:text-paper/50 dark:hover:text-paper/80"
      >
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        {label}
      </button>
      {open && (
        <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-card bg-ink/[0.03] p-3 text-xs text-ink/60 dark:bg-paper/[0.04] dark:text-paper/60">
          {content}
        </p>
      )}
    </div>
  );
}

const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-2" />,
  h1: (props) => <h1 {...props} className="mb-2 mt-4 font-display text-xl first:mt-0" />,
  h2: (props) => <h2 {...props} className="mb-2 mt-4 font-display text-lg first:mt-0" />,
  h3: (props) => <h3 {...props} className="mb-1.5 mt-3 font-display text-base first:mt-0" />,
  ul: (props) => <ul {...props} className="my-2 list-disc space-y-1 pl-5" />,
  ol: (props) => <ol {...props} className="my-2 list-decimal space-y-1 pl-5" />,
  p: (props) => <p {...props} className="leading-relaxed [&:not(:first-child)]:mt-2.5" />,
  code: (props) => <code {...props} className="rounded bg-ink/8 px-1 py-0.5 font-mono text-[0.85em] dark:bg-paper/10" />,
  blockquote: (props) => (
    <blockquote {...props} className="my-2 border-l-2 border-brass/40 pl-3 italic text-ink/70 dark:text-paper/70" />
  ),
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isResearch = message.mode === 'research';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-card rounded-br-sm bg-ink px-4 py-2.5 text-sm text-paper dark:bg-brass dark:text-ink">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-card rounded-bl-sm border border-ink/8 bg-surface-light px-4 py-3.5 text-sm text-ink shadow-soft dark:border-paper/8 dark:bg-surface-darkRaised dark:text-paper">
        {isResearch && (
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles size={13} className="text-verdigris" />
            <span className="text-xs font-semibold uppercase tracking-wide text-verdigris">Research report</span>
          </div>
        )}

        <div className="prose-sm">
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
        </div>

        {isResearch && message.researchData?.critique && <CritiquePanel critique={message.researchData.critique} />}

        {isResearch && (
          <>
            <CollapsibleRaw label="Raw search results" content={message.researchData?.searchResults} />
            <CollapsibleRaw label="Scraped source content" content={message.researchData?.scrapedContent} />
          </>
        )}

        {message.sources?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink/8 pt-3 dark:border-paper/8">
            {message.sources.map((s, i) => (
              <Badge key={i} tone="brass" title={s.content}>
                <FileText size={11} /> {s.documentName}
              </Badge>
            ))}
          </div>
        )}

        {message.webSources?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.webSources.map((w, i) => (
              <a key={i} href={w.url} target="_blank" rel="noreferrer">
                <Badge tone="verdigris">
                  <Globe size={11} /> {w.title.length > 32 ? `${w.title.slice(0, 32)}…` : w.title}
                </Badge>
              </a>
            ))}
          </div>
        )}

        {message.toolsUsed?.length > 0 && !isResearch && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink/40 dark:text-paper/40">
            <Wrench size={11} />
            {message.toolsUsed.join(', ')}
          </div>
        )}

        {message.mode === 'quick' && message.sources?.length === 0 && message.webSources?.length === 0 && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-ink/35 dark:text-paper/35">
            <BadgeCheck size={11} /> Answered from general knowledge
          </div>
        )}
      </div>
    </div>
  );
}
