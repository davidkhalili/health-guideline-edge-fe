'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface DisclaimerBannerProps {
  variant?: 'persistent' | 'dismissible';
  compact?: boolean;
}

export function DisclaimerBanner({ variant = 'persistent', compact = false }: DisclaimerBannerProps) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  
  if (variant === 'dismissible' && dismissed) return null;
  
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 border-b bg-clinical-caution/5 border-clinical-caution/20',
      compact ? 'py-1.5' : 'py-2.5'
    )}>
      <AlertTriangle className={cn(
        'text-clinical-caution flex-shrink-0',
        compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
      )} />
      <p className={cn(
        'flex-1 text-clinical-caution',
        compact ? 'text-[10px]' : 'text-xs'
      )}>
        <span className="font-medium">{t('disclaimer.title')}</span>
        {' '}{t('disclaimer.body')}
      </p>
      {variant === 'dismissible' && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-clinical-caution hover:text-clinical-caution hover:bg-clinical-caution/10"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">{t('common.dismiss')}</span>
        </Button>
      )}
    </div>
  );
}
