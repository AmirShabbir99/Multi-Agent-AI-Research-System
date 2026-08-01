import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessagesSquare,
  FileStack,
  History as HistoryIcon,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  BookMarked,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chat', label: 'Conversations', icon: MessagesSquare },
  { to: '/documents', label: 'Documents', icon: FileStack },
  { to: '/history', label: 'Activity', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ user, theme, toggleTheme, handleLogout, onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <BookMarked size={20} className="text-brass" />
        <span className="font-display text-lg tracking-tight">ResearchMind</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-card px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-brass/15 font-medium text-brass-deep dark:text-brass-soft'
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-paper/60 dark:hover:bg-paper/5 dark:hover:text-paper'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="mx-3 my-3 h-px bg-ink/10 dark:bg-paper/10" />
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-card px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-verdigris/15 font-medium text-verdigris-deep dark:text-verdigris-soft'
                    : 'text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-paper/60 dark:hover:bg-paper/5 dark:hover:text-paper'
                }`
              }
            >
              <ShieldCheck size={17} />
              Admin
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-ink/10 px-3 py-3 dark:border-paper/10">
        <div className="flex items-center gap-2.5 rounded-card px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/20 font-display text-sm text-brass-deep dark:text-brass-soft">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-ink/45 dark:text-paper/45">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-card px-3 py-2 text-xs text-ink/60 hover:bg-ink/5 dark:text-paper/60 dark:hover:bg-paper/5"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-card px-3 py-2 text-xs text-ink/60 hover:bg-oxblood/10 hover:text-oxblood dark:text-paper/60"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out.');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      {/* Desktop sidebar - the "case index" */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink/10 bg-surface-light dark:border-paper/10 dark:bg-surface-dark md:flex">
        <SidebarContent user={user} theme={theme} toggleTheme={toggleTheme} handleLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-surface-light/95 px-4 py-3 backdrop-blur dark:border-paper/10 dark:bg-surface-dark/95 md:hidden">
        <div className="flex items-center gap-2">
          <BookMarked size={18} className="text-brass" />
          <span className="font-display text-base">ResearchMind</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-card p-2 text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/5"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile slide-out drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-ink/40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface-light dark:bg-surface-dark md:hidden"
            >
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute right-3 top-4 rounded-card p-1.5 text-ink/50 hover:bg-ink/5 dark:text-paper/50"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
              <SidebarContent
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                handleLogout={handleLogout}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto pt-14 md:pt-0"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
