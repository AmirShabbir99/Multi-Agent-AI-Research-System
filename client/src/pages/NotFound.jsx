import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center dark:bg-ink">
      <Compass size={36} className="text-ink/25 dark:text-paper/25" />
      <div>
        <h1 className="font-display text-2xl text-ink dark:text-paper">This page hasn&apos;t been indexed</h1>
        <p className="mt-1.5 text-sm text-ink/55 dark:text-paper/55">
          Nothing to find at this address. Let&apos;s get you back on the trail.
        </p>
      </div>
      <Link to="/">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
