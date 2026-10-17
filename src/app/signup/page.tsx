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
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, Presentation } from 'lucide-react';

/**
 * /signup — create an account (same card idiom as /login). Client-checked:
 * name required, valid email, password ≥ 8 chars, confirm must match.
 * On success routes to /create.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { user, loading, signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → straight to the studio.
  useEffect(() => {
    if (!loading && user) router.replace('/create');
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = 'Tell us what to call you.';
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Password needs at least 8 characters.';
    if (confirm !== password) errors.confirm = 'Passwords don’t match.';
    if (!agreed) errors.terms = 'Please agree to the Terms and Privacy Policy.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const u = await signup(name.trim(), email.trim(), password);
      toast.success(`Welcome to the foundry, ${u.name || 'friend'}`);
      router.push('/create');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the account. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const passwordField = (
    id: string,
    value: string,
    onChange: (v: string) => void,
    label: string,
    autoComplete: string,
    error?: string,
    hint?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
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
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[color:var(--stg-ink)]/50">
          {hint}
        </p>
      ) : null}
    </div>
  );

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
              Join the foundry.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--stg-ink)]/65">
              A free account keeps your decks, themes and preferences together. No credit
              card, no watermark — free during beta, fair-use limits apply on AI generation.
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
                <Label htmlFor="signup-name" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                  Name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Poster"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'signup-name-error' : undefined}
                  className="h-11 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] placeholder:text-[color:var(--stg-ink)]/35 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-0"
                />
                {fieldErrors.name && (
                  <p id="signup-name-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="stg-label text-[10px] text-[color:var(--stg-ink)]/70">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
                  className="h-11 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] placeholder:text-[color:var(--stg-ink)]/35 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-0"
                />
                {fieldErrors.email && (
                  <p id="signup-email-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {passwordField(
                'signup-password',
                password,
                setPassword,
                'Password',
                'new-password',
                fieldErrors.password,
                'At least 8 characters.',
              )}
              {passwordField('signup-confirm', confirm, setConfirm, 'Confirm password', 'new-password', fieldErrors.confirm)}

              <div className="space-y-1">
                <label
                  htmlFor="signup-terms"
                  className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[color:var(--stg-ink)]/75"
                >
                  <Checkbox
                    id="signup-terms"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(v === true)}
                    aria-describedby={fieldErrors.terms ? 'signup-terms-error' : undefined}
                    className="mt-0.5 rounded-none border-2 border-[color:var(--stg-ink)] bg-white data-[state=checked]:border-[color:var(--stg-ink)] data-[state=checked]:bg-[color:var(--stg-ink)] data-[state=checked]:text-[color:var(--stg-yellow)]"
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="underline decoration-[color:var(--stg-yellow)] underline-offset-4 hover:bg-[color:var(--stg-yellow)]">Terms</Link>
                    {' '}and the{' '}
                    <Link href="/privacy" target="_blank" className="underline decoration-[color:var(--stg-yellow)] underline-offset-4 hover:bg-[color:var(--stg-yellow)]">Privacy Policy</Link>.
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p id="signup-terms-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.terms}
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
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Creating account…
                  </>
                ) : (
                  'Sign up'
                )}
              </Button>
            </form>

            <p className="mt-6 border-t-2 border-dashed border-[color:var(--stg-ink)]/20 pt-4 text-sm text-[color:var(--stg-ink)]/70">
              Already have an account?{' '}
              <Link
                href="/login"
                className="stg-label text-[10px] text-[color:var(--stg-ink)] underline decoration-[color:var(--stg-yellow)] decoration-[3px] underline-offset-4 hover:bg-[color:var(--stg-yellow)]"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
