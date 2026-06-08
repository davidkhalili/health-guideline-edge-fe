'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Heart,
  Layers,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

export function ValidationEntry() {
  const router = useRouter();
  const { t } = useI18n();
  const [isValidationInfoOpen, setValidationInfoOpen] = useState(false);

  const productHighlights = useMemo(
    () => [
      {
        title: t('landing.highlight1Title'),
        description: t('landing.highlight1Desc'),
        icon: BookOpen,
      },
      {
        title: t('landing.highlight2Title'),
        description: t('landing.highlight2Desc'),
        icon: Stethoscope,
      },
      {
        title: t('landing.highlight3Title'),
        description: t('landing.highlight3Desc'),
        icon: ShieldCheck,
      },
      {
        title: t('landing.highlight4Title'),
        description: t('landing.highlight4Desc'),
        icon: Layers,
      },
    ],
    [t]
  );

  const workflowSteps = useMemo(
    () => [
      {
        title: t('landing.step1Title'),
        description: t('landing.step1Desc'),
      },
      {
        title: t('landing.step2Title'),
        description: t('landing.step2Desc'),
      },
      {
        title: t('landing.step3Title'),
        description: t('landing.step3Desc'),
      },
    ],
    [t]
  );

  const validationNoticeItems = useMemo(
    () => [t('landing.validation1'), t('landing.validation2'), t('landing.validation3')],
    [t]
  );

  const handleStartClick = () => {
    setValidationInfoOpen(true);
  };

  const handleContinueToChatbot = () => {
    setValidationInfoOpen(false);
    router.push('/chat');
  };

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
          <div className="flex items-center gap-2">
            <PersianFontPreview />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <section className="grid gap-8 rounded-2xl border border-border bg-card/70 p-6 shadow-sm md:grid-cols-2 md:items-center md:p-8">
            <div className="space-y-5 landing-fade-up">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {t('landing.clinicalDecisionSupport')}
              </p>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{t('landing.heroTitle')}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{t('landing.heroDesc')}</p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2" onClick={handleStartClick}>
                  {t('landing.start')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="landing-fade-up-delay">
              <div className="landing-float rounded-2xl border border-border/80 bg-background p-3 shadow-sm">
                <Image
                  src="/landing-clinical-hero.svg"
                  alt={t('landing.heroImageAlt')}
                  width={720}
                  height={480}
                  className="h-auto w-full rounded-xl border border-border/60"
                  priority
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {productHighlights.map((highlight, index) => (
              <Card key={highlight.title} className="border-border/80">
                <CardHeader className={`space-y-2 ${index % 2 === 0 ? 'landing-fade-up' : 'landing-fade-up-delay'}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <highlight.icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">{highlight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{highlight.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <h2 className="text-xl font-semibold">{t('landing.howItWorks')}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className={`rounded-xl border border-border bg-background p-4 ${index === 0 ? 'landing-fade-up' : index === 1 ? 'landing-fade-up-delay' : 'landing-fade-up-delay-2'}`}
                >
                  <p className="mb-1 text-sm font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Dialog open={isValidationInfoOpen} onOpenChange={setValidationInfoOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('landing.validationTitle')}</DialogTitle>
            <DialogDescription>{t('landing.validationDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {validationNoticeItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-clinical-success" />
                <p className="text-muted-foreground">{item}</p>
              </div>
            ))}
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {t('landing.validationContinueHint')}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationInfoOpen(false)}>
              {t('common.back')}
            </Button>
            <Button onClick={handleContinueToChatbot}>{t('common.continue')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
