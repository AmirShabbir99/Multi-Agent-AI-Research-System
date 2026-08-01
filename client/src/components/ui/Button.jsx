import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-ink text-paper hover:bg-ink/90 dark:bg-brass dark:text-ink dark:hover:bg-brass-soft disabled:opacity-50',
  secondary:
    'bg-transparent text-ink border border-ink/20 hover:border-ink/40 hover:bg-ink/5 dark:text-paper dark:border-paper/20 dark:hover:border-paper/40 dark:hover:bg-paper/5',
  ghost: 'bg-transparent text-ink/70 hover:text-ink hover:bg-ink/5 dark:text-paper/70 dark:hover:text-paper dark:hover:bg-paper/5',
  danger: 'bg-oxblood text-paper hover:bg-oxblood/90 disabled:opacity-50',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const Button = forwardRef(
  ({ variant = 'primary', size = 'md', loading = false, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center rounded-card font-medium transition-colors duration-150 disabled:cursor-not-allowed',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
