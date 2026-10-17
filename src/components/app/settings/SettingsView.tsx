'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMotionPreference } from '@/components/app/settings/useMotionPreference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { THEMES, DEFAULT_THEME_ID } from '@/lib/design/themes';
import { KeyRound, Loader2, LogIn, LogOut, Palette, ShieldAlert, Sparkles, UserRound } from 'lucide-react';

/**
 * SettingsView — the four settings cards:
 *   1. Account (auth state, sign out / guest CTAs)
 *   2. Change password (signed-in only)
 *   3. Preferences (default design system + reduce motion, localStorage-backed)
 *   4. Danger zone (delete every studio + HTML deck, with confirm + progress)
 */

const DEFAULT_THEME_KEY = 'df_default_theme';

const inputClass =
  'h-11 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] placeholder:text-[color:var(--stg-ink)]/35 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-0';

const primaryButtonClass =
  'stg-label h-11 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-[10px] text-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-ink)] transition-all hover:bg-[color:var(--stg-yellow-deep)] hover:text-[color:var(--stg-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';

function cardFrame(extra?: string): string {
  return `border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-5 shadow-[6px_6px_0_0_var(--stg-ink)] sm:p-6 ${extra ?? ''}`;
}

function cardLabel(icon: React.ReactNode, text: string, tone: 'ink' | 'red' = 'ink') {
  return (
    <p
      className={`stg-label flex items-center gap-2.5 text-[10px] ${
        tone === 'red' ? 'text-red-700' : 'text-[color:var(--stg-ink)]/60'
      }`}
    >
      {icon}
      {text}
    </p>
  );
}

export function SettingsView() {
  const router = useRouter();
  const { user, loading, logout, changePassword } = useAuth();
  const [motionReduced, setMotionReduced] = useMotionPreference();

  // ---- password form ----
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // ---- preferences ----
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // ---- danger zone ----
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DEFAULT_THEME_KEY);
      if (saved && THEMES.some((t) => t.id === saved)) setThemeId(saved);
    } catch {
      /* storage unavailable — keep the default */
    }
    setPrefsLoaded(true);
  }, []);

  const saveThemePref = () => {
    try {
      window.localStorage.setItem(DEFAULT_THEME_KEY, themeId);
      toast.success('Preference saved');
    } catch {
      toast.error('Could not save the preference (storage unavailable).');
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (!current) {
      setPwError('Enter your current password.');
      return;
    }
    if (next.length < 8) {
      setPwError('New password needs at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setPwError('New passwords don’t match.');
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(current, next);
      toast.success('Password updated.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not update the password.');
    } finally {
      setPwBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
      toast.success('Signed out.');
      router.push('/');
    } catch {
      toast.error('Sign out failed — try again.');
    }
  };

  const purgeAllDecks = async () => {
    setPurgeBusy(true);
    const progressId = 'purge-all-decks';
    let studioDeleted = 0;
    let htmlDeleted = 0;
    try {
      const [studioRes, htmlRes] = await Promise.all([
        fetch('/api/decks'),
        fetch('/api/htmldecks'),
      ]);
      const studioDecks: Array<{ id: string }> = studioRes.ok
        ? ((await studioRes.json()) as { decks?: Array<{ id: string }> }).decks ?? []
        : [];
      const htmlDecks: Array<{ id: string }> = htmlRes.ok
        ? ((await htmlRes.json()) as { decks?: Array<{ id: string }> }).decks ?? []
        : [];
      const total = studioDecks.length + htmlDecks.length;

      if (total === 0) {
        toast.info('Nothing to delete — the archive is already empty.');
        return;
      }

      toast.loading(`Deleting 0/${total} decks…`, { id: progressId });

      for (const d of studioDecks) {
        try {
          const r = await fetch(`/api/decks/${d.id}`, { method: 'DELETE' });
          if (r.ok) studioDeleted += 1;
        } catch {
          /* keep purging */
        }
        toast.loading(`Deleting ${studioDeleted + htmlDeleted}/${total} decks…`, { id: progressId });
      }
      for (const d of htmlDecks) {
        try {
          const r = await fetch(`/api/htmldecks/${d.id}`, { method: 'DELETE' });
          if (r.ok) htmlDeleted += 1;
        } catch {
          /* keep purging */
        }
        toast.loading(`Deleting ${studioDeleted + htmlDeleted}/${total} decks…`, { id: progressId });
      }

      toast.success(`Deleted ${studioDeleted} studio + ${htmlDeleted} HTML decks`, { id: progressId });
      router.refresh();
      // Nudge any mounted lists (htmldecks:changed is the existing event).
      window.dispatchEvent(new Event('htmldecks:changed'));
    } catch {
      toast.error(
        `Deletion interrupted — removed ${studioDeleted} studio + ${htmlDeleted} HTML decks before the error.`,
        { id: progressId },
      );
    } finally {
      setPurgeBusy(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ============================================================
          1 · ACCOUNT
         ============================================================ */}
      <section className={cardFrame()} aria-labelledby="account-h">
        {cardLabel(<UserRound className="h-4 w-4" aria-hidden />, '01 · Account')}
        <h2 id="account-h" className="stg-display mt-2 text-2xl uppercase leading-none">
          Who&apos;s on stage
        </h2>

        {loading ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-[color:var(--stg-ink)]/60">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking session…
          </div>
        ) : user ? (
          <div className="mt-5 space-y-5">
            <div className="flex items-center gap-4">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] stg-display text-xl text-[color:var(--stg-ink)]"
                aria-hidden
              >
                {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[color:var(--stg-ink)]">
                  {user.name || 'DeckForge user'}
                </p>
                <p className="truncate text-sm text-[color:var(--stg-ink)]/60">{user.email}</p>
                {memberSince && (
                  <p className="stg-label mt-1 text-[9px] text-[color:var(--stg-ink)]/50">
                    Member since {memberSince}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={signOut}
              className="stg-label h-11 gap-2 rounded-none border-2 border-[color:var(--stg-ink)] bg-transparent text-[10px] text-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-ink)] transition-all hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
              You are browsing as a guest. Decks save to the DeckForge server — not your
              browser — and decks saved as a guest share a temporary common space. An
              account keeps them under your name.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="stg-label inline-flex h-11 items-center gap-2 rounded-none border-2 border-[color:var(--stg-ink)] bg-transparent px-4 text-[10px] text-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-ink)] transition-all hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]"
              >
                <LogIn className="h-4 w-4" aria-hidden /> Log in
              </Link>
              <Link
                href="/signup"
                className={primaryButtonClass + ' inline-flex items-center px-4'}
              >
                Sign up — it&apos;s free
              </Link>
            </div>
          </div>
        )}

        {/* plain-language data map — states exactly where things live */}
        <div className="mt-6 border-t-2 border-dashed border-[color:var(--stg-ink)]/20 pt-4">
          <p className="stg-label text-[9px] text-[color:var(--stg-ink)]/60">Where things live</p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--stg-ink)]/65">
            <li>· Decks &amp; exports → the DeckForge server database, tied to your account.</li>
            <li>· Uploads → parsed in your browser; only a summary is sent to plan charts. Never stored, never used for training.</li>
            <li>· Preferences (theme, motion) → this browser only (localStorage).</li>
          </ul>
        </div>
      </section>

      {/* ============================================================
          2 · CHANGE PASSWORD (signed-in only)
         ============================================================ */}
      {user && (
        <section className={cardFrame()} aria-labelledby="password-h">
          {cardLabel(<KeyRound className="h-4 w-4" aria-hidden />, '02 · Security')}
          <h2 id="password-h" className="stg-display mt-2 text-2xl uppercase leading-none">
            Change password
          </h2>

          {pwError && (
            <p
              role="alert"
              className="mt-4 border-2 border-red-600 bg-red-600/10 px-3 py-2 text-sm font-medium text-red-700"
            >
              {pwError}
            </p>
          )}

          <form onSubmit={submitPassword} className="mt-4 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="pw-current" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                Current password
              </Label>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pw-next" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                  New password
                </Label>
                <Input
                  id="pw-next"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-confirm" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                  Confirm new
                </Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <Button type="submit" disabled={pwBusy} className={primaryButtonClass + ' w-full sm:w-auto'}>
              {pwBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Updating…
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </section>
      )}

      {/* ============================================================
          3 · PREFERENCES
         ============================================================ */}
      <section className={cardFrame()} aria-labelledby="prefs-h">
        {cardLabel(<Palette className="h-4 w-4" aria-hidden />, user ? '03 · Preferences' : '02 · Preferences')}
        <h2 id="prefs-h" className="stg-display mt-2 text-2xl uppercase leading-none">
          Set the stage
        </h2>

        <div className="mt-5 space-y-6">
          {/* default design system */}
          <div className="space-y-2">
            <Label htmlFor="default-theme" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
              Default design system
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={themeId} onValueChange={setThemeId} disabled={!prefsLoaded}>
                <SelectTrigger
                  id="default-theme"
                  className="h-11 w-full rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-0 sm:w-64"
                >
                  <SelectValue placeholder="Pick a design system" />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)]">
                  {THEMES.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="rounded-none">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={saveThemePref}
                className={primaryButtonClass + ' w-full sm:w-auto'}
                aria-label="Save default design system preference"
              >
                <Sparkles className="h-4 w-4" aria-hidden /> Save
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--stg-ink)]/55">
              Preselects this system in the studio gallery. Applied to new decks you start.
            </p>
          </div>

          {/* reduce motion */}
          <div className="flex items-start justify-between gap-4 border-t-2 border-dashed border-[color:var(--stg-ink)]/20 pt-5">
            <div>
              <Label htmlFor="reduce-motion" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                Reduce motion
              </Label>
              <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--stg-ink)]/55">
                Skips entrance animations across the app (landing, view transitions). The
                editor and presentations are never affected.
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={motionReduced}
              onCheckedChange={setMotionReduced}
              aria-label="Toggle reduced motion"
              className="mt-1 data-[state=checked]:bg-[color:var(--stg-ink)] data-[state=unchecked]:bg-[color:var(--stg-ink)]/25"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          4 · DANGER ZONE
         ============================================================ */}
      <section
        className="border-2 border-red-600 bg-[color:var(--stg-cream)] p-5 shadow-[6px_6px_0_0_#dc2626] sm:p-6"
        aria-labelledby="danger-h"
      >
        {cardLabel(<ShieldAlert className="h-4 w-4" aria-hidden />, user ? '04 · Danger zone' : '03 · Danger zone', 'red')}
        <h2 id="danger-h" className="stg-display mt-2 text-2xl uppercase leading-none">
          Delete all decks
        </h2>
        {loading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-[color:var(--stg-ink)]/60">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking session…
          </p>
        ) : !user ? (
          <div className="mt-3 space-y-4">
            <p className="text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
              Bulk deletion is available to signed-in accounts only — as a guest, your decks
              sit in a temporary shared space. Sign in to manage them.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="stg-label inline-flex h-11 items-center gap-2 rounded-none border-2 border-[color:var(--stg-ink)] bg-transparent px-4 text-[10px] text-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-ink)] transition-all hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]"
              >
                <LogIn className="h-4 w-4" aria-hidden /> Log in
              </Link>
              <Link href="/signup" className={primaryButtonClass + ' inline-flex items-center px-4'}>
                Sign up — it&apos;s free
              </Link>
            </div>
          </div>
        ) : (
          <>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
          Permanently removes every studio deck <em>and</em> every HTML template deck saved in
          this workspace. Decks currently open in the editor keep running until you leave; the
          files are gone afterwards. This cannot be undone — you&apos;ll be asked to type
          DELETE to confirm.
        </p>

        <AlertDialog open={purgeOpen} onOpenChange={(o) => { setPurgeOpen(o); if (!o) setPurgeConfirm(''); }}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={purgeBusy}
              className="stg-label mt-5 h-11 gap-2 rounded-none border-2 border-red-600 bg-transparent text-[10px] text-red-700 shadow-[4px_4px_0_0_#dc2626] transition-all hover:bg-red-600 hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {purgeBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Deleting…
                </>
              ) : (
                'Delete all decks'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="stg-display text-2xl uppercase">
                Delete every deck?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed text-[color:var(--stg-ink)]/75">
                This lists all studio decks and HTML template decks, then deletes each one
                permanently — both libraries are wiped. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="purge-confirm" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                Type <span className="font-bold uppercase">DELETE</span> to confirm
              </Label>
              <Input
                id="purge-confirm"
                value={purgeConfirm}
                onChange={(e) => setPurgeConfirm(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="rounded-none border-2 border-[color:var(--stg-ink)] bg-transparent font-semibold hover:bg-[color:var(--stg-ink)]/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={purgeAllDecks}
                disabled={purgeConfirm.trim().toUpperCase() !== 'DELETE' || purgeBusy}
                className="rounded-none border-2 border-red-600 bg-red-600 font-semibold text-white hover:bg-red-700 focus-visible:ring-red-600 disabled:pointer-events-none disabled:opacity-40"
              >
                Yes, delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </>
        )}
      </section>
    </div>
  );
}
