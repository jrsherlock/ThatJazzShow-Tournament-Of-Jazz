'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/artists', label: 'Artists' },
  { href: '/admin/matchup-previews', label: 'Matchup Previews' },
  { href: '/admin/master-bracket', label: 'Master Bracket' },
  { href: '/admin/reveal', label: 'Reveal' },
  { href: '/admin/submissions', label: 'Submissions' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-surface-hover border-r border-subtle flex flex-col">
        {/* Logo / Title */}
        <div className="p-5 border-b border-subtle">
          <Link href="/admin" className="block">
            <h1 className="text-lg font-bold text-accent tracking-wide">
              Tournament of Jazz
            </h1>
            <p className="text-xs text-dim mt-0.5">Admin Panel</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded text-sm transition-colors ${
                isActive(href)
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-muted hover:text-zinc-200 hover:bg-charcoal/60'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-subtle">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-muted hover:text-red-400 hover:bg-charcoal/60 rounded transition-colors text-left cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
