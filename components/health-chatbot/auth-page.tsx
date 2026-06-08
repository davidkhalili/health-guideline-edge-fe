'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowRight, Heart, Loader2, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (typeof window === 'undefined') {
      return;
    }
    const requested = (new URLSearchParams(window.location.search).get('next') || '/chat').trim();
    setRedirectTarget(requested.startsWith('/') ? requested : '/chat');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        const [authStatus, authConfig] = await Promise.all([getAuthStatus(), getAuthConfig()]);
        if (cancelled) {
          return;
        }
        setGoogleEnabled(authConfig.googleEnabled);
        if (authStatus.authenticated) {
          router.replace(redirectTarget);
          return;
        }
      } catch {
        if (!cancelled) {
          setGoogleEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      }
    };
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [redirectTarget, router]);

  const submitLabel = mode === 'login' ? t('auth.signIn') : t('auth.createAccount');
  const submitIcon = mode === 'login' ? LogIn : UserPlus;
  const googleLocaleOverride = { locale: locale === 'fa' ? 'fa' : 'en' } as unknown as Record<string, never>;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
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
    if (isSubmitting) {
      return;
    }
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

  const headerControls = (
    <div className="flex items-center gap-2">
      <PersianFontPreview />
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card/85 backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-accent/70 dark:hover:bg-accent/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold">HealthGuidelineEdge</span>
            </Link>
            {headerControls}
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-56px)] items-center justify-center p-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('auth.checkingSession')}
          </div>
        </main>
      </div>
    );
  }

  const SubmitIcon = submitIcon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-accent/70 dark:hover:bg-accent/40">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">HealthGuidelineEdge</span>
          </Link>
          {headerControls}
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-56px)] items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/80">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t('auth.secureAccess')}
            </CardTitle>
            <CardDescription>{t('auth.secureAccessDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === 'login' ? 'default' : 'outline'}
                onClick={() => setMode('login')}
                disabled={isSubmitting}
              >
                {t('auth.login')}
              </Button>
              <Button
                type="button"
                variant={mode === 'register' ? 'default' : 'outline'}
                onClick={() => setMode('register')}
                disabled={isSubmitting}
              >
                {t('auth.createUser')}
              </Button>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">{t('auth.email')}</Label>
                <Input
                  id="auth-email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auth-password">{t('auth.password')}</Label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    mode === 'login' ? t('auth.passwordPlaceholder') : t('auth.registerPasswordPlaceholder')
                  }
                  disabled={isSubmitting}
                />
              </div>
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-confirm-password">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="auth-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <SubmitIcon className="me-2 h-4 w-4" />
                )}
                {submitLabel}
              </Button>
            </form>

            {googleEnabled && (
              <div className="space-y-2">
                <div className="relative text-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">{t('common.or')}</span>
                  <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
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

            <div className="rounded-md border border-border bg-muted/35 p-3">
              <p className="text-xs text-muted-foreground">{t('auth.guestTrialHint')}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => setGuestDialogOpen(true)}
                disabled={isSubmitting}
              >
                <ArrowRight className="me-2 h-4 w-4" />
                {t('auth.continueWithoutLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('auth.guestLimitationsTitle')}</DialogTitle>
            <DialogDescription>{t('auth.guestLimitationsDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>- {t('auth.guestLimit1')}</p>
            <p>- {t('auth.guestLimit2')}</p>
            <p>- {t('auth.guestLimit3')}</p>
            <p>- {t('auth.guestLimit4')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuestDialogOpen(false)}>
              {t('common.back')}
            </Button>
            <Button onClick={handleContinueAsGuest}>{t('auth.continueAsGuest')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
