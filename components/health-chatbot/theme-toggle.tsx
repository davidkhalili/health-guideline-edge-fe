'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { applyTheme, getStoredTheme, persistTheme, type ThemeMode } from '@/lib/theme';
import { useI18n } from '@/lib/i18n/context';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const handleToggle = () => {
    setTheme((currentTheme) => {
      const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      persistTheme(nextTheme);
      return nextTheme;
    });
  };

  const isDark = theme === 'dark';
  const targetMode = isDark ? t('theme.lightMode') : t('theme.darkMode');

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('h-8 gap-1.5', className)}
      onClick={handleToggle}
      aria-label={t('theme.switchTo', { mode: targetMode })}
      title={t('theme.switchTo', { mode: targetMode })}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isDark ? t('theme.lightMode') : t('theme.darkMode')}</span>
    </Button>
  );
}
