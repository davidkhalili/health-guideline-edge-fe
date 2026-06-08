'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Heart,
  Layers,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ThemeToggle } from '@/components/health-chatbot/theme-toggle';
import { LanguageToggle } from '@/components/health-chatbot/language-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function LandingPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  const handleStart = () => {
    setShowValidationDialog(true);
  };

  const handleContinue = () => {
    setShowValidationDialog(false);
    router.push('/chat');
  };

  const features = [
    {
      icon: BookOpen,
      title: t('landing.highlight1Title'),
      description: t('landing.highlight1Desc'),
    },
    {
      icon: Clock3,
      title: t('landing.highlight2Title'),
      description: t('landing.highlight2Desc'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.highlight3Title'),
      description: t('landing.highlight3Desc'),
    },
    {
      icon: Layers,
      title: t('landing.highlight4Title'),
      description: t('landing.highlight4Desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header with Theme and Language Toggles */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 border-b z-40 bg-card" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-accent" fill="currentColor" />
          <span className="font-bold text-lg">HealthGuidelineEdge</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-accent uppercase tracking-wide">
                {t('landing.clinicalDecisionSupport')}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                {t('landing.heroTitle')}
              </h1>
            </div>

            <p className="text-lg text-muted-foreground max-w-lg">
              {t('landing.heroDesc')}
            </p>

            <Button
              onClick={handleStart}
              size="lg"
              className="w-full sm:w-auto"
            >
              {t('landing.start')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Right side - Illustration */}
          <div className="relative h-96 lg:h-full hidden lg:flex items-center justify-center">
            <div
              className="relative w-full h-full rounded border"
              style={{
                borderColor: 'var(--border)',
                background: `linear-gradient(135deg, ${window.getComputedStyle(document.documentElement).getPropertyValue('--card').trim()} 0%, ${window.getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim()} 100%)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <Stethoscope className="w-32 h-32 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('landing.howItWorks')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('landing.step1Desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 px-6 bg-card border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h3 className="text-2xl font-bold">{t('landing.step3Title')}</h3>
          <p className="text-muted-foreground">{t('landing.step3Desc')}</p>
          <Button onClick={handleStart} size="lg" className="w-full sm:w-auto">
            {t('landing.start')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 px-6 border-t text-center text-sm text-muted-foreground" style={{ borderColor: 'var(--border)' }}>
        <p>
          {t('disclaimer.title')} {t('disclaimer.body')}
        </p>
      </div>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('landing.validationTitle')}</DialogTitle>
            <DialogDescription>{t('landing.validationDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-clinical-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('landing.validation1')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-clinical-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('landing.validation2')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-clinical-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('landing.validation3')}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleContinue}>
              {t('common.continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
