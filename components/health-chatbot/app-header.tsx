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
    <header
      className="h-12 border-b flex items-center justify-between px-3 sticky top-0 z-30 backdrop-blur-sm"
      style={{
        background: 'var(--window-titlebar)',
        borderColor: 'var(--window-border)',
      }}
    >
      {/* Left — logo + nav tabs */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--amber)', color: 'var(--ink)' }}
          >
            <Heart className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold hidden sm:block" style={{ color: 'var(--ink)' }}>
            HealthGuidelineEdge
          </span>
        </Link>

        {/* OS-style tab switcher */}
        <nav
          className="hidden md:flex items-center rounded p-0.5 gap-0.5"
          style={{ background: 'var(--paper-2)', border: '1px solid var(--window-border)' }}
        >
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium transition-colors"
            style={
              currentView === 'chat'
                ? { background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--window-border)', boxShadow: '0 1px 3px var(--window-shadow)' }
                : { background: 'transparent', color: 'var(--ink-light)' }
            }
            onClick={() => onViewChange('chat')}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t('header.chat')}
          </button>
          {canManageSources && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium transition-colors"
              style={
                currentView === 'sources'
                  ? { background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--window-border)', boxShadow: '0 1px 3px var(--window-shadow)' }
                  : { background: 'transparent', color: 'var(--ink-light)' }
              }
              onClick={() => onViewChange('sources')}
            >
              <Database className="h-3.5 w-3.5" />
              {t('header.sources')}
            </button>
          )}
        </nav>
      </div>

      {/* Center — source + model selectors */}
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

      {/* Right — user info + controls */}
      <div className="flex items-center gap-1.5">
        {currentView === 'chat' && onOpenHistory && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => void onOpenHistory()}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">{t('header.openSessionHistory')}</span>
          </Button>
        )}

        <div className="hidden lg:flex items-center gap-2 me-1">
          <Badge
            variant={currentUser?.role === 'admin' ? 'default' : 'secondary'}
            className="text-xs"
            style={
              currentUser?.role === 'admin'
                ? { background: 'var(--amber)', color: 'var(--ink)', border: '1px solid var(--amber-dark)' }
                : {}
            }
          >
            {roleLabel}
          </Badge>
          <span
            className="max-w-[180px] truncate text-xs"
            style={{ color: 'var(--ink-light)' }}
            title={currentUser?.email || t('header.guestSession')}
          >
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            style={{ color: 'var(--ink-light)' }}
            onClick={() => void onLogout?.()}
          >
            <LogOut className="h-3.5 w-3.5 me-1.5" />
            <span className="hidden sm:inline">{t('header.logout')}</span>
          </Button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium transition-colors"
            style={{
              background: 'var(--amber)',
              color: 'var(--ink)',
              border: '1.5px solid var(--amber-dark)',
            }}
            onClick={() => void onLogin?.()}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('header.login')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
