'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LayoutGrid, LogOut, Menu, Presentation, Settings as SettingsIcon } from 'lucide-react';

/**
 * SiteHeader — the shared ink bar for every page (landing included).
 * Logo → '/', nav with active state, auth-aware right side:
 *  - guest: Log in (ghost) + Sign up (yellow) [+ optional "Start creating" CTA]
 *  - signed in: avatar-initial dropdown (My decks / Settings / Sign out)
 * Mobile: nav + auth collapse into a Sheet.
 */

const NAV_ITEMS = [
  { href: '/pitch', label: 'Showcase' },
  { href: '/create', label: 'Create' },
  { href: '/decks', label: 'My decks' },
  { href: '/settings', label: 'Settings' },
] as const;

function isActivePathname(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ showCreateCta = false }: { showCreateCta?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = async () => {
    try {
      await logout();
      toast.success('Signed out. See you at the next show.');
      router.push('/');
    } catch {
      toast.error('Sign out failed — try again.');
    }
  };

  const navLinks = (onNavigate?: () => void) =>
    NAV_ITEMS.map((item) => {
      const active = isActivePathname(pathname, item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'stg-label inline-flex items-center gap-2 py-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]',
            active
              ? 'text-[color:var(--stg-yellow)]'
              : 'stg-link text-white/60 hover:text-[color:var(--stg-cream)]',
          )}
        >
          <span
            className={cn('h-1.5 w-1.5', active ? 'bg-[color:var(--stg-yellow)]' : 'bg-transparent')}
            aria-hidden
          />
          {item.label}
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-40 h-16 border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
          aria-label="DeckForge AI home"
        >
          <span className="grid h-8 w-8 place-items-center bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]">
            <Presentation className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="stg-display text-xl uppercase leading-none">
            DeckForge
            <span className="stg-label ml-2 align-middle text-[9px] text-[color:var(--stg-yellow)]">AI</span>
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Primary">
          {navLinks()}
        </nav>

        {/* right side — auth-aware */}
        <div className="ml-auto flex items-center gap-2 md:ml-7">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                suppressHydrationWarning
                aria-label="Account menu"
                className="grid h-9 w-9 place-items-center rounded-full border-2 border-[color:var(--stg-yellow)]/60 bg-[color:var(--stg-yellow)] text-sm font-bold text-[color:var(--stg-ink)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
              >
                {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate text-sm font-semibold">{user.name || 'DeckForge user'}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/decks')}>
                  <LayoutGrid className="h-4 w-4" /> My decks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <SettingsIcon className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="stg-label inline-flex h-9 items-center px-3 text-[10px] text-white/70 transition-colors hover:text-[color:var(--stg-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="stg-label inline-flex h-9 items-center border border-[color:var(--stg-yellow)]/60 px-4 text-[10px] text-[color:var(--stg-yellow)] transition-colors hover:border-[color:var(--stg-yellow)] hover:bg-[color:var(--stg-yellow)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
              >
                Sign up
              </Link>
              {showCreateCta && (
                <Link
                  href="/create"
                  className="stg-label ml-1 hidden h-9 items-center bg-[color:var(--stg-yellow)] px-4 text-[10px] text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)] lg:inline-flex"
                >
                  Start creating
                </Link>
              )}
            </div>
          )}

          {/* mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            {/* suppressHydrationWarning: Radix generates the aria-controls id
                via useId — a stale dev bundle (HMR across server restarts) can
                hold an older tree position, which makes that single auto-id
                differ on first paint. It self-corrects; keep the console clean
                instead of alarming the user with a hydration wall of text. */}
            <SheetTrigger
              suppressHydrationWarning
              aria-label="Open menu"
              className="grid h-11 w-11 place-items-center border border-white/20 text-[color:var(--stg-cream)] transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 max-w-[86vw] border-l-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]"
            >
              <SheetHeader className="border-b border-white/10">
                <SheetTitle className="stg-display text-lg uppercase tracking-wide text-[color:var(--stg-cream)]">
                  DeckForge AI
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
                {NAV_ITEMS.map((item) => {
                  const active = isActivePathname(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'stg-label flex h-11 items-center gap-2.5 text-[11px] transition-colors',
                        active
                          ? 'bg-white/10 text-[color:var(--stg-yellow)]'
                          : 'text-white/70 hover:bg-white/5 hover:text-[color:var(--stg-cream)]',
                      )}
                    >
                      <span
                        className={cn('h-1.5 w-1.5', active ? 'bg-[color:var(--stg-yellow)]' : 'bg-white/25')}
                        aria-hidden
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto space-y-2 border-t border-white/10 p-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 pb-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--stg-yellow)] text-sm font-bold text-[color:var(--stg-ink)]">
                        {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{user.name || 'DeckForge user'}</span>
                        <span className="block truncate text-xs text-white/50">{user.email}</span>
                      </span>
                    </div>
                    <button
                      onClick={signOut}
                      className="stg-label flex h-11 w-full items-center gap-2 border border-white/20 px-4 text-[10px] text-white/80 transition-colors hover:border-red-600 hover:text-red-500"
                    >
                      <LogOut className="h-4 w-4" aria-hidden /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="stg-label flex h-11 items-center justify-center border border-white/25 text-[10px] text-[color:var(--stg-cream)] transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="stg-label flex h-11 items-center justify-center border border-[color:var(--stg-yellow)]/60 text-[10px] text-[color:var(--stg-yellow)] transition-colors hover:bg-[color:var(--stg-yellow)]/10"
                    >
                      Sign up
                    </Link>
                    <Link
                      href="/create"
                      onClick={() => setMenuOpen(false)}
                      className="stg-label flex h-11 items-center justify-center gap-2 bg-[color:var(--stg-yellow)] text-[10px] text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)]"
                    >
                      <Presentation className="h-4 w-4" aria-hidden /> Start creating
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* accessibility: announce auth state to screen readers without visual noise
          (nothing is announced while the first session check is in flight — the
          header already renders the guest state by default, so there is no flash) */}
      <span className="sr-only" aria-live="polite">
        {!loading && (user ? `Signed in as ${user.name || user.email}` : 'Browsing as guest')}
      </span>
    </header>
  );
}
