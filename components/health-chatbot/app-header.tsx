'use client';

import Link from 'next/link';
import type { ActiveSourceSet, AuthUser, KnowledgeSource, LlmOption, ServiceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SourceSelector } from './source-selector';
import { ServiceStatusIndicator } from './service-status';
import { ModelSelector } from './model-selector';
import { Database, Heart, LogIn, LogOut, MessageSquare, PanelLeft } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { PersianFontPreview } from './persian-font-preview';
import { useI18n } from '@/lib/i18n/context';

interface AppHeaderProps {
  currentView: 'chat' | 'sources';
  onViewChange: (view: 'chat' | 'sources') => void;
  canManageSources: boolean;
  sources: KnowledgeSource[];
  activeSources: ActiveSourceSet;
  onSourceChange: (sources: ActiveSourceSet) => void;
  llmOptions: LlmOption[];
  selectedLlmOptionId: string;
  canSelectLlm: boolean;
  onSelectLlmOption: (optionId: string) => void;
  currentUser: AuthUser | null;
  onLogout?: () => Promise<void> | void;
  onLogin?: () => Promise<void> | void;
  serviceStatus: ServiceStatus;
  onOpenHistory?: () => void;
}

export function AppHeader({
  currentView,
  onViewChange,
  canManageSources,
  sources,
  activeSources,
  onSourceChange,
  llmOptions,
  selectedLlmOptionId,
  canSelectLlm,
  onSelectLlmOption,
  currentUser,
  onLogout,
  onLogin,
  serviceStatus,
  onOpenHistory,
}: AppHeaderProps) {
  const { t } = useI18n();
  const isAuthenticated = Boolean(currentUser);
  const roleLabel =
    currentUser?.role === 'admin'
      ? t('roles.admin')
      : currentUser?.role === 'user'
        ? t('roles.user')
        : t('roles.guest');

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 z-30 bg-card" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-accent/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <Heart className="h-4 w-4 text-accent" fill="currentColor" />
          </div>
          <span className="font-semibold text-sm hidden sm:block">HealthGuidelineEdge</span>
        </Link>

        <nav className="hidden md:flex items-center border rounded-lg p-0.5" style={{ borderColor: 'var(--border)' }}>
          <Button
            variant={currentView === 'chat' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => onViewChange('chat')}
          >
            <MessageSquare className="h-3.5 w-3.5 me-1.5" />
            {t('header.chat')}
          </Button>
          {canManageSources && (
            <Button
              variant={currentView === 'sources' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onViewChange('sources')}
            >
              <Database className="h-3.5 w-3.5 me-1.5" />
              {t('header.sources')}
            </Button>
          )}
        </nav>
      </div>

      <div className="hidden lg:flex items-center gap-2">
        <SourceSelector
          sources={sources}
          activeSources={activeSources}
          onSourceChange={onSourceChange}
        />
        <ModelSelector
          options={llmOptions}
          selectedOptionId={selectedLlmOptionId}
          canSelect={canSelectLlm}
          onSelect={onSelectLlmOption}
        />
      </div>

      <div className="flex items-center gap-2">
        {currentView === 'chat' && onOpenHistory && (
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => void onOpenHistory()}>
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">{t('header.openSessionHistory')}</span>
          </Button>
        )}
        <div className="hidden lg:flex items-center gap-2">
          <Badge variant={currentUser?.role === 'admin' ? 'default' : 'secondary'}>
            {roleLabel}
          </Badge>
          <span className="max-w-[200px] truncate text-xs text-muted-foreground" title={currentUser?.email || t('header.guestSession')}>
            {currentUser?.email || t('header.guestSession')}
          </span>
        </div>
        <PersianFontPreview />
        <LanguageToggle />
        <ThemeToggle />
        <div className="hidden sm:block">
          <ServiceStatusIndicator status={serviceStatus} />
        </div>
        {isAuthenticated ? (
          <Button variant="ghost" size="sm" className="h-8" onClick={() => void onLogout?.()}>
            <LogOut className="h-3.5 w-3.5 me-1.5" />
            <span className="hidden sm:inline">{t('header.logout')}</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-8" onClick={() => void onLogin?.()}>
            <LogIn className="h-3.5 w-3.5 me-1.5" />
            <span className="hidden sm:inline">{t('header.login')}</span>
          </Button>
        )}
      </div>
    </header>
  );
}
