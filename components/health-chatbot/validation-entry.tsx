'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, CircleCheck as CheckCircle2, FileText, Heart, Layers, MessageSquare, ShieldCheck, Stethoscope, User, X, Minus, Square, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n/context';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { PersianFontPreview } from './persian-font-preview';

/* ------------------------------------------------------------------ */
/* Mini OS window used only on the landing desktop                     */
/* ------------------------------------------------------------------ */
interface DemoWindowProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  animClass?: string;
}

function DemoWindow({ title, icon, children, className = '', animClass = 'window-appear' }: DemoWindowProps) {
  return (
    <div
      className={`os-window pointer-events-none select-none ${animClass} ${className}`}
      style={{ position: 'relative' }}
    >
      <div className="os-titlebar">
        <div className="os-traffic-lights">
          <span className="os-traffic-light os-traffic-light-close" />
          <span className="os-traffic-light os-traffic-light-minimize" />
          <span className="os-traffic-light os-traffic-light-maximize" />
        </div>
        <div className="os-titlebar-drag flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--ink)' }}>
          {icon}
          {title}
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop icon                                                        */
/* ------------------------------------------------------------------ */
interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  accent?: boolean;
}

function DesktopIcon({ icon, label, onClick, accent }: DesktopIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="os-icon group"
      aria-label={label}
    >
      <div
        className={`os-icon-img transition-transform group-hover:scale-105 group-active:scale-95 ${accent ? 'ring-2 ring-offset-1' : ''}`}
        style={accent ? { background: 'var(--amber)', color: 'var(--ink)' } : {}}
      >
        {icon}
      </div>
      <span className="os-icon-label">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export function ValidationEntry() {
  const router = useRouter();
  const { t } = useI18n();
  const [isValidationInfoOpen, setValidationInfoOpen] = useState(false);

  const validationNoticeItems = useMemo(
    () => [t('landing.validation1'), t('landing.validation2'), t('landing.validation3')],
    [t]
  );

  const handleStartClick = useCallback(() => {
    setValidationInfoOpen(true);
  }, []);

  const handleContinueToChatbot = useCallback(() => {
    setValidationInfoOpen(false);
    router.push('/chat');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--ink)' }}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header
        className="h-12 border-b flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-sm"
        style={{
          borderColor: 'var(--window-border)',
          background: 'var(--window-titlebar)',
        }}
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
          <span className="text-sm font-semibold tracking-tight hidden sm:block">HealthGuidelineEdge</span>
        </Link>

        <div className="flex items-center gap-2">
          <PersianFontPreview />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Desktop area ────────────────────────────────────── */}
      <main className="flex-1 os-desktop overflow-hidden relative">

        {/* Hero copy — centered on desktop */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center pt-12 pb-6 px-4 landing-fade-up">
          <span
            className="ink-tag mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)' }}
          >
            {t('landing.clinicalDecisionSupport')}
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl"
            style={{ color: 'var(--ink)' }}
          >
            {t('landing.heroTitle')}
          </h1>
          <p
            className="text-base md:text-lg max-w-xl mb-8 leading-relaxed"
            style={{ color: 'var(--ink-light)' }}
          >
            {t('landing.heroDesc')}
          </p>
          <Button
            size="lg"
            className="gap-2 font-semibold shadow-md"
            style={{ background: 'var(--amber)', color: 'var(--ink)', border: '1.5px solid var(--amber-dark)' }}
            onClick={handleStartClick}
          >
            {t('landing.start')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop icons row */}
        <div className="relative z-10 flex items-center justify-center gap-8 flex-wrap px-4 pb-6 landing-fade-up-delay">
          <DesktopIcon
            icon={<MessageSquare className="h-6 w-6" />}
            label={t('header.chat')}
            onClick={handleStartClick}
            accent
          />
          <DesktopIcon
            icon={<BookOpen className="h-6 w-6" />}
            label={t('landing.highlight1Title')}
            onClick={handleStartClick}
          />
          <DesktopIcon
            icon={<ShieldCheck className="h-6 w-6" />}
            label={t('landing.highlight3Title')}
            onClick={handleStartClick}
          />
          <DesktopIcon
            icon={<Layers className="h-6 w-6" />}
            label={t('landing.highlight4Title')}
            onClick={handleStartClick}
          />
          <DesktopIcon
            icon={<User className="h-6 w-6" />}
            label={t('landing.highlight2Title')}
            onClick={handleStartClick}
          />
          <DesktopIcon
            icon={<FileText className="h-6 w-6" />}
            label={t('header.sources')}
            onClick={handleStartClick}
          />
        </div>

        {/* Floating demo windows — visible on md+ */}
        <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-3 gap-4 items-start">

            {/* Window 1 — Ask like a clinician */}
            <DemoWindow
              title={t('landing.highlight1Title')}
              icon={<MessageSquare className="h-3 w-3" />}
              animClass="window-appear"
              className="shadow-lg"
            >
              <div className="space-y-2">
                <div
                  className="rounded-md px-3 py-2 text-xs"
                  style={{ background: 'var(--paper-2)', color: 'var(--ink)', border: '1px solid var(--window-border)' }}
                >
                  <span style={{ color: 'var(--ink-light)' }}>You</span>
                  <p className="mt-1">{t('landing.step1Title')}</p>
                </div>
                <div
                  className="rounded-md px-3 py-2 text-xs"
                  style={{ background: 'var(--amber-light)', color: 'var(--ink)', border: '1px solid var(--amber)' }}
                >
                  <span style={{ color: 'var(--amber-dark)' }}>AI</span>
                  <p className="mt-1">{t('landing.step2Title')}</p>
                </div>
                <div className="flex gap-1 pt-1">
                  {['[1]', '[2]', '[3]'].map((c) => (
                    <span key={c} className="citation-marker text-xs">{c}</span>
                  ))}
                </div>
              </div>
            </DemoWindow>

            {/* Window 2 — Evidence panel */}
            <DemoWindow
              title={t('landing.highlight3Title')}
              icon={<ShieldCheck className="h-3 w-3" />}
              animClass="window-appear-delay"
              className="shadow-lg"
            >
              <div className="space-y-2">
                {[
                  { icon: <Search className="h-3 w-3" />, label: t('landing.highlight1Title') },
                  { icon: <FileText className="h-3 w-3" />, label: t('landing.highlight2Title') },
                  { icon: <Clock className="h-3 w-3" />, label: t('landing.highlight4Title') },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
                    style={{ background: 'var(--paper)', border: '1px solid var(--window-border)', color: 'var(--ink)' }}
                  >
                    <span style={{ color: 'var(--amber-dark)' }}>{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="ms-auto ink-tag text-xs px-1.5 py-0.5">{i + 1}</span>
                  </div>
                ))}
              </div>
            </DemoWindow>

            {/* Window 3 — Context */}
            <DemoWindow
              title={t('landing.highlight2Title')}
              icon={<Stethoscope className="h-3 w-3" />}
              animClass="window-appear-delay-2"
              className="shadow-lg"
            >
              <div className="space-y-2 text-xs" style={{ color: 'var(--ink)' }}>
                {[
                  ['Age', '45'],
                  ['Weight', '78 kg'],
                  ['Condition', 'T2DM'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{ background: 'var(--paper)', border: '1px solid var(--window-border)' }}
                  >
                    <span style={{ color: 'var(--ink-light)' }}>{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <div
                  className="rounded px-2 py-1 text-xs mt-1"
                  style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)', border: '1px solid var(--amber)' }}
                >
                  {t('landing.step3Title')}
                </div>
              </div>
            </DemoWindow>
          </div>
        </div>

        {/* Feature highlights — paper cards */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: BookOpen, key: 'highlight1' },
              { icon: Stethoscope, key: 'highlight2' },
              { icon: ShieldCheck, key: 'highlight3' },
              { icon: Layers, key: 'highlight4' },
            ].map(({ icon: Icon, key }, i) => (
              <div
                key={key}
                className={`paper-card landing-fade-up${i === 0 ? '' : i === 1 ? '-delay' : '-delay-2'}`}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center mb-3"
                  style={{ background: 'var(--amber-light)' }}
                >
                  <Icon className="h-4 w-4" style={{ color: 'var(--amber-dark)' }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                  {t(`landing.${key}Title` as any)}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-light)' }}>
                  {t(`landing.${key}Desc` as any)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Taskbar-style bottom strip */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 h-10 border-t flex items-center justify-center gap-6 text-xs backdrop-blur-sm"
          style={{
            background: 'var(--window-titlebar)',
            borderColor: 'var(--window-border)',
            color: 'var(--ink-light)',
          }}
        >
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" style={{ color: 'var(--amber-dark)' }} />
            HealthGuidelineEdge
          </span>
          <span
            className="ink-tag hidden sm:inline"
            style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)' }}
          >
            {t('landing.clinicalDecisionSupport')}
          </span>
        </div>
      </main>

      {/* ── Validation dialog ───────────────────────────────── */}
      <Dialog open={isValidationInfoOpen} onOpenChange={setValidationInfoOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('landing.validationTitle')}</DialogTitle>
            <DialogDescription>{t('landing.validationDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {validationNoticeItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  style={{ color: 'var(--clinical-success)' }}
                />
                <p style={{ color: 'var(--ink-light)' }}>{item}</p>
              </div>
            ))}
            <div
              className="rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'var(--paper-2)',
                border: '1px solid var(--window-border)',
                color: 'var(--ink-light)',
              }}
            >
              {t('landing.validationContinueHint')}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationInfoOpen(false)}>
              {t('common.back')}
            </Button>
            <Button
              style={{ background: 'var(--amber)', color: 'var(--ink)', border: '1.5px solid var(--amber-dark)' }}
              onClick={handleContinueToChatbot}
            >
              {t('common.continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
