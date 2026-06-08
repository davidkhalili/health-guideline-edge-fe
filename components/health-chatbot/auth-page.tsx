'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowRight, Heart, Loader as Loader2, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import {
  getAuthConfig,
  getAuthStatus,
  loginWithGoogle,
  loginWithPassword,
  registerWithPassword,
} from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/context';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { PersianFontPreview } from './persian-font-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AuthMode = 'login' | 'register';

function AuthHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header
      className="h-12 border-b flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-sm"
      style={{ background: 'var(--window-titlebar)', borderColor: 'var(--window-border)' }}
    >
      <Link
        href="/"
        className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: 'var(--amber)', color: 'var(--ink)' }}
        >
          <Heart className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold hidden sm:block" style={{ color: 'var(--ink)' }}>
          HealthGuidelineEdge
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {children}
        <PersianFontPreview />
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}

export function AuthPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [redirectTarget, setRedirectTarget] = useState('/chat');
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requested = (new URLSearchParams(window.location.search).get('next') || '/chat').trim();
    setRedirectTarget(requested.startsWith('/') ? requested : '/chat');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        const [authStatus, authConfig] = await Promise.all([getAuthStatus(), getAuthConfig()]);
        if (cancelled) return;
        setGoogleEnabled(authConfig.googleEnabled);
        if (authStatus.authenticated) {
          router.replace(redirectTarget);
          return;
        }
      } catch {
        if (!cancelled) setGoogleEnabled(false);
      } finally {
        if (!cancelled) setIsLoadingSession(false);
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, [redirectTarget, router]);

  const googleLocaleOverride = { locale: locale === 'fa' ? 'fa' : 'en' } as unknown as Record<string, never>;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithPassword({ email: normalizedEmail, password });
      } else {
        await registerWithPassword({ email: normalizedEmail, password });
      }
      router.replace(redirectTarget);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('auth.authFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle(idToken);
      router.replace(redirectTarget);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('auth.googleFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAsGuest = () => {
    setGuestDialogOpen(false);
    router.replace('/chat');
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--ink)' }}>
        <AuthHeader />
        <main className="flex min-h-[calc(100vh-48px)] items-center justify-center p-6">
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--ink-light)' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('auth.checkingSession')}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen os-desktop" style={{ color: 'var(--ink)' }}>
      <AuthHeader />

      <main className="flex min-h-[calc(100vh-48px)] items-center justify-center p-6">
        {/* Auth form as an OS window */}
        <div
          className="os-window window-appear w-full max-w-md"
          style={{ boxShadow: '0 8px 40px var(--window-shadow)' }}
        >
          {/* Titlebar */}
          <div className="os-titlebar">
            <div className="os-traffic-lights">
              <span className="os-traffic-light os-traffic-light-close" />
              <span className="os-traffic-light os-traffic-light-minimize" />
              <span className="os-traffic-light os-traffic-light-maximize" />
            </div>
            <div className="os-titlebar-drag flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--ink)' }}>
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--amber-dark)' }} />
              {t('auth.secureAccess')}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs" style={{ color: 'var(--ink-light)' }}>{t('auth.secureAccessDesc')}</p>
            </div>

            {/* Mode toggle */}
            <div
              className="grid grid-cols-2 gap-0.5 rounded-md p-0.5"
              style={{ background: 'var(--paper-2)', border: '1px solid var(--window-border)' }}
            >
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="rounded px-3 py-2 text-sm font-medium transition-colors"
                  style={
                    mode === m
                      ? { background: 'var(--paper)', color: 'var(--ink)', boxShadow: '0 1px 3px var(--window-shadow)', border: '1px solid var(--window-border)' }
                      : { background: 'transparent', color: 'var(--ink-light)' }
                  }
                  onClick={() => { setMode(m); setError(''); }}
                  disabled={isSubmitting}
                >
                  {m === 'login' ? t('auth.login') : t('auth.createUser')}
                </button>
              ))}
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{t('auth.email')}</Label>
                <Input
                  id="auth-email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auth-password" className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{t('auth.password')}</Label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? t('auth.passwordPlaceholder') : t('auth.registerPasswordPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-confirm-password" className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{t('auth.confirmPassword')}</Label>
                  <Input
                    id="auth-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: 'var(--amber)', color: 'var(--ink)', border: '1.5px solid var(--amber-dark)' }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'login' ? (
                  <LogIn className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
              </button>
            </form>

            {googleEnabled && (
              <div className="space-y-3">
                <div className="relative text-center">
                  <span
                    className="px-2 text-xs relative z-10"
                    style={{ background: 'var(--window-chrome)', color: 'var(--ink-light)' }}
                  >
                    {t('common.or')}
                  </span>
                  <div className="absolute inset-x-0 top-1/2 -z-0 h-px" style={{ background: 'var(--window-border)' }} />
                </div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      const credential = credentialResponse.credential || '';
                      if (credential) {
                        void handleGoogleLogin(credential);
                      } else {
                        setError(t('auth.googleNoToken'));
                      }
                    }}
                    onError={() => setError(t('auth.googleCancelled'))}
                    useOneTap={false}
                    {...googleLocaleOverride}
                  />
                </div>
              </div>
            )}

            {/* Guest option */}
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: 'var(--paper-2)', border: '1px solid var(--window-border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--ink-light)' }}>{t('auth.guestTrialHint')}</p>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors"
                style={{ background: 'transparent', color: 'var(--ink-light)', border: '1px solid var(--window-border)' }}
                onClick={() => setGuestDialogOpen(true)}
                disabled={isSubmitting}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                {t('auth.continueWithoutLogin')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('auth.guestLimitationsTitle')}</DialogTitle>
            <DialogDescription>{t('auth.guestLimitationsDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm" style={{ color: 'var(--ink-light)' }}>
            <p>- {t('auth.guestLimit1')}</p>
            <p>- {t('auth.guestLimit2')}</p>
            <p>- {t('auth.guestLimit3')}</p>
            <p>- {t('auth.guestLimit4')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuestDialogOpen(false)}>
              {t('common.back')}
            </Button>
            <Button
              style={{ background: 'var(--amber)', color: 'var(--ink)', border: '1.5px solid var(--amber-dark)' }}
              onClick={handleContinueAsGuest}
            >
              {t('auth.continueAsGuest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
