'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { SiteHeader } from '@/components/app/SiteHeader';
import { SiteFooter } from '@/components/app/SiteFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Presentation } from 'lucide-react';

/**
 * /login — centered on-brand card. Consumes the auth contract via
 * AuthProvider.login(); on success routes to /create (the studio).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → straight to the studio.
  useEffect(() => {
    if (!loading && user) router.replace('/create');
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.name || 'friend'}`);
      router.push('/create');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not sign in. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--stg-cream)]">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-6 shadow-[8px_8px_0_0_var(--stg-ink)] sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]">
                <Presentation className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/60">DeckForge AI</span>
            </div>

            <h1 className="stg-display mt-5 text-4xl uppercase leading-[0.95] text-[color:var(--stg-ink)]">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--stg-ink)]/65">
              Log in to your decks, themes and exports. The stage never closed — it was waiting for you.
            </p>

            {formError && (
              <p
                role="alert"
                className="mt-5 border-2 border-red-600 bg-red-600/10 px-3 py-2.5 text-sm font-medium text-red-700"
              >
                {formError}
              </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                  className="h-11 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] placeholder:text-[color:var(--stg-ink)]/35 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-0"
                />
                {fieldErrors.email && (
                  <p id="login-email-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                    className="h-11 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] pr-11 text-[color:var(--stg-ink)] placeholder:text-[color:var(--stg-ink)]/35 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[color:var(--stg-ink)]/50 transition-colors hover:text-[color:var(--stg-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="login-password-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="stg-label h-12 w-full rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-[11px] text-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-ink)] transition-all hover:bg-[color:var(--stg-yellow-deep)] hover:text-[color:var(--stg-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing in…
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </form>

            <p className="mt-6 border-t-2 border-dashed border-[color:var(--stg-ink)]/20 pt-4 text-sm text-[color:var(--stg-ink)]/70">
              New to the foundry?{' '}
              <Link
                href="/signup"
                className="stg-label text-[10px] text-[color:var(--stg-ink)] underline decoration-[color:var(--stg-yellow)] decoration-[3px] underline-offset-4 hover:bg-[color:var(--stg-yellow)]"
              >
                Sign up — it&apos;s free
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
