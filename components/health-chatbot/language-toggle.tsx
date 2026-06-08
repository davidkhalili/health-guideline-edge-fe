'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale, setLocale, t } = useI18n();

  const nextLocale: Locale = locale === 'en' ? 'fa' : 'en';
  const nextLabel = nextLocale === 'fa' ? t('locale.fa') : t('locale.en');

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('h-8 gap-1.5', className)}
      onClick={() => setLocale(nextLocale)}
      aria-label={t('locale.switchTo', { language: nextLabel })}
      title={t('locale.switchTo', { language: nextLabel })}
    >
      <Languages className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{locale === 'en' ? 'فا' : 'EN'}</span>
    </Button>
  );
}
