import clsx from 'clsx';
import { FileQuestion, AlertCircle, Loader2 } from 'lucide-react';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-card border border-ink/10 bg-surface-light shadow-soft dark:border-paper/10 dark:bg-surface-darkRaised',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const BADGE_TONES = {
  brass: 'bg-brass/15 text-brass-deep dark:text-brass-soft',
  verdigris: 'bg-verdigris/15 text-verdigris-deep dark:text-verdigris-soft',
  oxblood: 'bg-oxblood/15 text-oxblood',
  neutral: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }) {
  return <div className={clsx('skeleton rounded-card', className)} />;
}

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-ink/40 dark:text-paper/40', className)} />;
}

export function EmptyState({ icon: Icon = FileQuestion, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-ink/15 px-6 py-14 text-center dark:border-paper/15">
      <Icon size={28} className="text-ink/30 dark:text-paper/30" />
      <div>
        <p className="font-display text-lg text-ink dark:text-paper">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-ink/55 dark:text-paper/55">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-oxblood/20 bg-oxblood/5 px-6 py-14 text-center">
      <AlertCircle size={28} className="text-oxblood" />
      <div>
        <p className="font-display text-lg text-ink dark:text-paper">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-ink/55 dark:text-paper/55">{description}</p>}
      </div>
      {action}
    </div>
  );
}
