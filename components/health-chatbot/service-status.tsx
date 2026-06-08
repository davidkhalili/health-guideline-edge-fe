'use client';

import { cn } from '@/lib/utils';
import type { ServiceStatus } from '@/lib/types';
import type { TranslateFn } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import {
  WifiOff,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ServiceStatusBannerProps {
  status: ServiceStatus;
  onRetry?: () => void;
}

function getStatusConfig(t: TranslateFn) {
  return {
    online: {
      icon: CheckCircle2,
      label: t('serviceStatus.online'),
      description: t('serviceStatus.onlineDesc'),
      color: 'text-clinical-success',
      bgColor: 'bg-clinical-success/10',
      borderColor: 'border-clinical-success/20',
      showBanner: false,
    },
    warming: {
      icon: Loader2,
      label: t('serviceStatus.warming'),
      description: t('serviceStatus.warmingDesc'),
      color: 'text-clinical-warning',
      bgColor: 'bg-clinical-warning/10',
      borderColor: 'border-clinical-warning/20',
      showBanner: true,
      iconAnimation: 'animate-spin',
    },
    offline: {
      icon: WifiOff,
      label: t('serviceStatus.offline'),
      description: t('serviceStatus.offlineDesc'),
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      showBanner: true,
    },
    degraded: {
      icon: AlertTriangle,
      label: t('serviceStatus.degraded'),
      description: t('serviceStatus.degradedDesc'),
      color: 'text-clinical-caution',
      bgColor: 'bg-clinical-caution/10',
      borderColor: 'border-clinical-caution/20',
      showBanner: true,
    },
    retrying: {
      icon: RefreshCw,
      label: t('serviceStatus.retrying'),
      description: t('serviceStatus.retryingDesc'),
      color: 'text-clinical-warning',
      bgColor: 'bg-clinical-warning/10',
      borderColor: 'border-clinical-warning/20',
      showBanner: true,
      iconAnimation: 'animate-spin',
    },
  } as const;
}

export function ServiceStatusBanner({ status, onRetry }: ServiceStatusBannerProps) {
  const { t } = useI18n();
  const statusConfig = getStatusConfig(t);
  const config = statusConfig[status];
  const Icon = config.icon;

  if (!config.showBanner) return null;

  return (
    <div
      className={cn(
        'px-4 py-3 border-b flex items-center justify-between gap-4',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', config.color, 'iconAnimation' in config && config.iconAnimation)} />
        <div>
          <p className={cn('text-sm font-medium', config.color)}>{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {(status === 'offline' || status === 'degraded') && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5 me-1.5" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

interface ServiceStatusIndicatorProps {
  status: ServiceStatus;
}

export function ServiceStatusIndicator({ status }: ServiceStatusIndicatorProps) {
  const { t } = useI18n();
  const statusConfig = getStatusConfig(t);
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'online' && 'bg-clinical-success',
          status === 'warming' && 'bg-clinical-warning animate-pulse',
          status === 'offline' && 'bg-destructive',
          status === 'degraded' && 'bg-clinical-caution',
          status === 'retrying' && 'bg-clinical-warning animate-pulse'
        )}
      />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
