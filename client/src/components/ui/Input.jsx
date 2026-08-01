import { forwardRef } from 'react';
import clsx from 'clsx';

const fieldBase =
  'w-full rounded-card border bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 transition-colors focus:border-brass dark:text-paper dark:placeholder:text-paper/40';

export const Input = forwardRef(({ label, error, hint, className, id, ...props }, ref) => {
  const fieldId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-paper/80">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={fieldId}
        className={clsx(fieldBase, error ? 'border-oxblood' : 'border-ink/15 dark:border-paper/15', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-oxblood">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink/50 dark:text-paper/50">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';

export const TextArea = forwardRef(({ label, error, hint, className, id, ...props }, ref) => {
  const fieldId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-paper/80">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        className={clsx(fieldBase, 'resize-none', error ? 'border-oxblood' : 'border-ink/15 dark:border-paper/15', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-oxblood">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink/50 dark:text-paper/50">{hint}</p>}
    </div>
  );
});
TextArea.displayName = 'TextArea';
