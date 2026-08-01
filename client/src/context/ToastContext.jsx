import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ACCENTS = {
  success: 'text-verdigris border-verdigris/30',
  error: 'text-oxblood border-oxblood/30',
  warning: 'text-brass border-brass/30',
  info: 'text-ink/70 dark:text-paper/70 border-ink/10 dark:border-paper/10',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { type = 'info', duration = 4500 } = {}) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg, opts) => push(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => push(msg, { ...opts, type: 'error' }),
    warning: (msg, opts) => push(msg, { ...opts, type: 'warning' }),
    info: (msg, opts) => push(msg, { ...opts, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border bg-surface-light px-4 py-3 shadow-soft dark:bg-surface-darkRaised ${ACCENTS[t.type]}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm text-ink dark:text-paper">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-ink/40 hover:text-ink/70 dark:text-paper/40 dark:hover:text-paper/70"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
