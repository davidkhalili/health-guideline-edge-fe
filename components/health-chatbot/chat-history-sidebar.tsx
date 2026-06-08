'use client';

import { cn } from '@/lib/utils';
import type { ChatSessionSummary } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn, MessageSquarePlus, PanelLeftClose } from 'lucide-react';

interface ChatHistorySidebarProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string;
  isLoading?: boolean;
  loadingSessionId?: string;
  isGuest?: boolean;
  className?: string;
  onNewChat: () => void;
  onSignIn?: () => void;
  onHide?: () => void;
  onSelectSession: (sessionId: string) => void;
}

function formatTimestamp(value: string, unknownLabel: string): string {
  if (!value) {
    return unknownLabel;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function ChatHistorySidebar({
  sessions,
  activeSessionId,
  isLoading = false,
  loadingSessionId = '',
  isGuest = false,
  className,
  onNewChat,
  onSignIn,
  onHide,
  onSelectSession,
}: ChatHistorySidebarProps) {
  const { t } = useI18n();

  return (
    <aside className={cn('h-full w-full shrink-0 flex-col border-e border-border bg-card/50 flex', className)}>
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t('chat.sessionHistory')}</h2>
            <p className="text-xs text-muted-foreground">
              {isGuest ? t('chat.guestHistoryHint') : t('chat.authHistoryHint')}
            </p>
          </div>
          {onHide && (
            <Button variant="ghost" size="icon-sm" onClick={onHide} className="h-7 w-7">
              <PanelLeftClose className="h-4 w-4" />
              <span className="sr-only">{t('chat.hideSessionHistory')}</span>
            </Button>
          )}
        </div>
        <Button className="w-full justify-start" variant="outline" onClick={onNewChat}>
          <MessageSquarePlus className="me-2 h-4 w-4" />
          {t('chat.newChat')}
        </Button>
        {isGuest && (
          <Button className="w-full justify-start" variant="ghost" onClick={() => void onSignIn?.()}>
            <LogIn className="me-2 h-4 w-4" />
            {t('chat.loginForHistory')}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isGuest ? (
          <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            {t('chat.guestNoPersist')}
          </div>
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            {t('chat.loadingSessions')}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            {t('chat.noSessions')}
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => {
              const isActive = session.sessionId === activeSessionId;
              const isOpening = session.sessionId === loadingSessionId;
              return (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => onSelectSession(session.sessionId)}
                  disabled={isOpening}
                  className={`w-full rounded-md border px-3 py-2 text-start transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:border-border hover:bg-accent/70 dark:hover:bg-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-2 text-xs font-medium text-foreground">{session.title}</p>
                    {isOpening ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {session.turnCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t('common.updated')} {formatTimestamp(session.updatedAt, t('common.unknown'))}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
