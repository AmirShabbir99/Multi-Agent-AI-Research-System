import { useState, useRef } from 'react';
import { Send, Sparkles, MessageCircle, Globe } from 'lucide-react';
import clsx from 'clsx';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState('quick');
  const [allowWebSearch, setAllowWebSearch] = useState(true);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend({ message: trimmed, mode, allowWebSearch });
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const autoResize = (e) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur dark:border-paper/10 dark:bg-ink/95 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-ink/12 p-0.5 dark:border-paper/12">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                mode === 'quick'
                  ? 'bg-brass text-ink'
                  : 'text-ink/50 hover:text-ink/80 dark:text-paper/50 dark:hover:text-paper/80'
              )}
            >
              <MessageCircle size={12} /> Quick
            </button>
            <button
              type="button"
              onClick={() => setMode('research')}
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                mode === 'research'
                  ? 'bg-verdigris text-paper'
                  : 'text-ink/50 hover:text-ink/80 dark:text-paper/50 dark:hover:text-paper/80'
              )}
            >
              <Sparkles size={12} /> Deep research
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAllowWebSearch((v) => !v)}
            className={clsx(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              allowWebSearch
                ? 'border-brass/40 text-brass-deep dark:text-brass-soft'
                : 'border-ink/12 text-ink/40 dark:border-paper/12 dark:text-paper/40'
            )}
            title="Allow the assistant to search the live web"
          >
            <Globe size={12} /> Web search {allowWebSearch ? 'on' : 'off'}
          </button>

          {mode === 'research' && (
            <span className="text-[11px] text-ink/40 dark:text-paper/40">
              Runs the full search → read → write → critique pipeline. Takes longer.
            </span>
          )}
        </div>

        <div className="flex items-end gap-2 rounded-card border border-ink/15 bg-surface-light px-3 py-2 focus-within:border-brass dark:border-paper/15 dark:bg-surface-darkRaised">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={mode === 'research' ? 'What topic should I research in depth?' : 'Ask anything...'}
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none disabled:opacity-50 dark:text-paper dark:placeholder:text-paper/40"
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-ink text-paper transition-opacity disabled:opacity-30 dark:bg-brass dark:text-ink"
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
