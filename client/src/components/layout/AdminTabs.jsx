import { NavLink } from 'react-router-dom';
import { LayoutGrid, Users, ScrollText } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/logs', label: 'Logs', icon: ScrollText },
];

export default function AdminTabs() {
  return (
    <div className="flex gap-1 rounded-full border border-ink/12 p-0.5 dark:border-paper/12" style={{ width: 'fit-content' }}>
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              isActive ? 'bg-ink text-paper dark:bg-brass dark:text-ink' : 'text-ink/50 hover:text-ink/80 dark:text-paper/50 dark:hover:text-paper/80'
            )
          }
        >
          <Icon size={13} /> {label}
        </NavLink>
      ))}
    </div>
  );
}
