'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { KnowledgeSource, ActiveSourceSet } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import type { TranslateFn } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Globe,
  MapPin,
  Building2,
  FileText,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface SourceSelectorProps {
  sources: KnowledgeSource[];
  activeSources: ActiveSourceSet;
  onSourceChange: (sources: ActiveSourceSet) => void;
}

function getScopeIcon(scopeType: string) {
  switch (scopeType) {
    case 'global':
      return <Globe className="h-4 w-4" />;
    case 'country':
      return <MapPin className="h-4 w-4" />;
    case 'regional':
      return <Building2 className="h-4 w-4" />;
    case 'custom':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ready':
      return 'bg-clinical-success';
    case 'pending':
      return 'bg-clinical-warning';
    case 'failed':
      return 'bg-destructive';
    default:
      return 'bg-muted-foreground';
  }
}

function statusLabel(status: string, t: TranslateFn): string {
  if (status === 'ready') return t('sourceSelector.statusReady');
  if (status === 'pending') return t('sourceSelector.statusPending');
  if (status === 'failed') return t('sourceSelector.statusFailed');
  return status;
}

export function SourceSelector({ sources, activeSources, onSourceChange }: SourceSelectorProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const countrySources = sources.filter((s) => s.scopeType === 'country');
  const globalSources = sources.filter((s) => s.scopeType === 'global' || s.scopeType === 'regional');
  const customSources = sources.filter((s) => s.scopeType === 'custom');

  const activeCount = (activeSources.countrySource ? 1 : 0) + activeSources.globalSources.length;

  const isSourceActive = (source: KnowledgeSource) => {
    if (source.scopeType === 'country') {
      return activeSources.countrySource?.id === source.id;
    }
    return activeSources.globalSources.some((s) => s.id === source.id);
  };

  const toggleSource = (source: KnowledgeSource) => {
    if (source.status !== 'ready') return;

    if (source.scopeType === 'country') {
      onSourceChange({
        ...activeSources,
        countrySource: activeSources.countrySource?.id === source.id ? undefined : source,
      });
    } else {
      const isActive = activeSources.globalSources.some((s) => s.id === source.id);
      onSourceChange({
        ...activeSources,
        globalSources: isActive
          ? activeSources.globalSources.filter((s) => s.id !== source.id)
          : [...activeSources.globalSources, source],
      });
    }
  };

  const renderSourceItem = (source: KnowledgeSource) => {
    const isActive = isSourceActive(source);
    const isReady = source.status === 'ready';

    return (
      <DropdownMenuItem
        key={source.id}
        onClick={() => toggleSource(source)}
        disabled={!isReady}
        className={cn(
          'flex items-center gap-3 py-2.5 px-3 cursor-pointer',
          !isReady && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div
          className={cn(
            'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-primary border-primary' : 'border-border'
          )}
        >
          {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{getScopeIcon(source.scopeType)}</span>
            <span className="text-sm font-medium truncate">{source.title}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(source.status))} />
            <span className="text-xs text-muted-foreground">{statusLabel(source.status, t)}</span>
            {source.status === 'pending' && (
              <Loader2 className="h-3 w-3 animate-spin text-clinical-warning" />
            )}
            {source.status === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
          </div>
        </div>

        <div className="text-end flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {source.documentCount} {t('common.docs')}
          </span>
        </div>
      </DropdownMenuItem>
    );
  };

  const activeLabel =
    activeCount === 1
      ? t('sourceSelector.sourceActive')
      : t('sourceSelector.sourcesActive', { count: activeCount });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3 gap-2">
          <Globe className="h-3.5 w-3.5" />
          <span className="text-sm">{activeLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t('sourceSelector.selectSources')}
        </DropdownMenuLabel>

        {countrySources.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-medium flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {t('sourceSelector.countryGuidelines')}
                <span className="text-muted-foreground font-normal">{t('sourceSelector.selectOne')}</span>
              </DropdownMenuLabel>
              {countrySources.map(renderSourceItem)}
            </DropdownMenuGroup>
          </>
        )}

        {globalSources.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                {t('sourceSelector.globalRegional')}
              </DropdownMenuLabel>
              {globalSources.map(renderSourceItem)}
            </DropdownMenuGroup>
          </>
        )}

        {customSources.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                {t('sourceSelector.customSources')}
              </DropdownMenuLabel>
              {customSources.map(renderSourceItem)}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
