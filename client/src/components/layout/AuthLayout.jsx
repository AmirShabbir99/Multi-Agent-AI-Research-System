import { motion } from 'framer-motion';
import { BookMarked } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen">
      {/* Editorial side panel - visible on larger screens only */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <BookMarked size={22} className="text-brass" />
          <span className="font-display text-xl">ResearchMind</span>
        </div>

        <div className="max-w-md">
          <p className="font-display text-[2.75rem] italic leading-[1.15] text-paper/95">
            Every answer,
            <br />
            traced to its source.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-paper/55">
            Upload your own documents or send an agent out to research the web — either way, you get a
            cited answer and an honest, self-scored critique of the work.
          </p>
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-paper/35">
          Search · Read · Write · Critique
        </p>

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-verdigris/10 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-paper px-6 py-12 dark:bg-ink lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <div className="mb-6 flex items-center gap-2">
              <BookMarked size={20} className="text-brass" />
              <span className="font-display text-lg">ResearchMind</span>
            </div>
          </div>
          <h1 className="font-display text-2xl text-ink dark:text-paper">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink/55 dark:text-paper/55">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
