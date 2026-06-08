'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type {
  ChatMessage,
  Citation,
  ActiveSourceSet,
  FeedbackRating,
  KnowledgeSource,
  PatientContext,
} from '@/lib/types';
import type { TranslateFn } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { isFeedbackEligibleMessage } from '@/lib/message-feedback';
import { SessionEndSummary, workflowFitClasses, workflowFitLabel } from './chat-runtime';
import { useResizablePanel } from './hooks/use-resizable-panel';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { SourceViewerPanel } from './source-viewer-panel';
import { EmptyChatState } from './empty-chat-state';
import { SourceSelector } from './source-selector';
import { PatientContextPanel } from './patient-context-panel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  BookOpenText,
  ChevronDown,
  PanelLeftClose,
  PanelRightOpen,
  SlidersHorizontal,
} from 'lucide-react';

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  userAvatarUrl?: string;
  onSendMessage: (message: string) => void;
  onTranscribeAudio?: (audioFile: File) => Promise<string>;
  pendingFeedbackMessageId?: string;
  onSubmitMessageFeedback?: (messageId: string, feedback: { rating: FeedbackRating; notes: string }) => void;
  completedRatedTurns?: number;
  checkpointTurnTarget?: number;
  canEndTest?: boolean;
  onEndTest?: () => void;
  chatDisabledReason?: string;
  sessionEnded?: boolean;
  sessionEndSummary?: SessionEndSummary | null;
  patientContext: PatientContext;
  onPatientContextChange: (next: PatientContext) => void;
  isLoading?: boolean;
  sources: KnowledgeSource[];
  activeSources: ActiveSourceSet;
  onSourceChange: (sources: ActiveSourceSet) => void;
  onResolveCitation?: (citation: Citation, question: string) => Promise<Citation>;
  isGuest?: boolean;
  guestQuestionCount?: number;
  guestQuestionLimit?: number;
  historySidebarOverlayOffset?: number;
}

function endTriggerLabel(trigger: string, t: TranslateFn): string {
  if (trigger === 'manual') return t('chat.endTriggerManual');
  if (trigger === 'checkpoint') return t('chat.endTriggerCheckpoint');
  if (trigger === 'auto-guest-limit') return t('chat.endTriggerAutoGuest');
  return trigger;
}

export function ChatWorkspace({
  messages,
  userAvatarUrl,
  onSendMessage,
  onTranscribeAudio,
  pendingFeedbackMessageId,
  onSubmitMessageFeedback,
  completedRatedTurns = 0,
  checkpointTurnTarget = 10,
  canEndTest = false,
  onEndTest,
  chatDisabledReason,
  sessionEnded = false,
  sessionEndSummary,
  patientContext,
  onPatientContextChange,
  isLoading,
  sources,
  activeSources,
  onSourceChange,
  onResolveCitation,
  isGuest = false,
  guestQuestionCount = 0,
  guestQuestionLimit = 10,
  historySidebarOverlayOffset = 0,
}: ChatWorkspaceProps) {
  const { t, isRtl } = useI18n();
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [sourceViewerOpen, setSourceViewerOpen] = useState(false);
  const [patientSidebarOpen, setPatientSidebarOpen] = useState(true);
  const [mobileSourceViewerOpen, setMobileSourceViewerOpen] = useState(false);
  const [mobilePatientContextOpen, setMobilePatientContextOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [patientSidebarFocused, setPatientSidebarFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const patientSidebarRef = useRef<HTMLElement>(null);
  const sourceSignature = `${activeSources.countrySource?.id || ''}|${activeSources.globalSources
    .map((source) => source.id)
    .join(',')}`;
  const {
    width: sourceViewerWidth,
    handleResizeStart: handleSourceResizeStart,
  } = useResizablePanel({
    initialWidth: 360,
    minWidth: 280,
    maxWidth: 560,
  });
  const {
    width: patientSidebarWidth,
    handleResizeStart: handlePatientResizeStart,
  } = useResizablePanel({
    initialWidth: 340,
    minWidth: 280,
    maxWidth: 520,
    direction: 'expand_left',
    invertDelta: isRtl,
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setSourceViewerOpen(false);
    setMobileSourceViewerOpen(false);
    setSelectedCitation(null);
  }, [sourceSignature]);

  useEffect(() => {
    if (!patientSidebarFocused || !patientSidebarOpen) {
      return;
    }
    const rafId = window.requestAnimationFrame(() => {
      patientSidebarRef.current?.focus({ preventScroll: true });
    });
    const timerId = window.setTimeout(() => {
      setPatientSidebarFocused(false);
    }, 1500);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [patientSidebarFocused, patientSidebarOpen]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  const handleCitationClick = async (citation: Citation, question: string) => {
    let resolvedCitation = citation;
    if (onResolveCitation) {
      resolvedCitation = await onResolveCitation(citation, question);
    }
    setSelectedCitation(resolvedCitation);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setMobileSourceViewerOpen(true);
    } else {
      setSourceViewerOpen(true);
    }
  };

  const closeSourceViewer = () => {
    setSourceViewerOpen(false);
    setMobileSourceViewerOpen(false);
    setTimeout(() => setSelectedCitation(null), 120);
  };

  const focusPatientContextPanel = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
      setMobilePatientContextOpen(true);
      return;
    }
    setPatientSidebarOpen(true);
    setPatientSidebarFocused(true);
  }, []);

  const isEmpty = messages.length === 0;
  const sourceViewerLeftOffset = Math.max(0, historySidebarOverlayOffset);
  const feedbackBlockReason = pendingFeedbackMessageId
    ? t('chat.completeRatingToContinue')
    : undefined;
  const effectiveBlockedReason = chatDisabledReason || feedbackBlockReason;
  const inputDisabled = Boolean(effectiveBlockedReason);

  const sourceViewerPositionStyle = isRtl
    ? { width: sourceViewerWidth, right: -sourceViewerLeftOffset }
    : { width: sourceViewerWidth, left: -sourceViewerLeftOffset };

  return (
    <div className="relative flex flex-1 min-w-0">
      {sourceViewerOpen && (
        <div
          style={sourceViewerPositionStyle}
          className="absolute inset-y-0 z-40 hidden lg:block"
        >
          <SourceViewerPanel
            citation={selectedCitation}
            onClose={closeSourceViewer}
            isOpen={sourceViewerOpen}
            className="h-full w-full shadow-xl"
          />
          <div
            className="absolute inset-y-0 end-0 z-10 w-1.5 cursor-col-resize bg-transparent transition hover:bg-border/60"
            onPointerDown={handleSourceResizeStart}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {isEmpty ? (
          <EmptyChatState onSuggestionClick={onSendMessage} />
        ) : (
          <>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8"
            >
              <div className="max-w-3xl mx-auto py-4">
                <div className="mb-4 pb-4 border-b border-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {t('chat.activeSources')}
                      <span className="text-foreground font-medium ms-1">
                        {activeSources.countrySource?.title || t('common.none')}
                        {activeSources.globalSources.length > 0 && (
                          <>
                            {' '}
                            {t('chat.globalCount', { count: activeSources.globalSources.length })}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs xl:hidden"
                        onClick={() => setMobilePatientContextOpen(true)}
                      >
                        <SlidersHorizontal className="me-1.5 h-3.5 w-3.5" />
                        {t('chat.context')}
                      </Button>
                      {selectedCitation && !sourceViewerOpen && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="hidden h-7 text-xs lg:inline-flex"
                          onClick={() => setSourceViewerOpen(true)}
                        >
                          <BookOpenText className="me-1.5 h-3.5 w-3.5" />
                          {t('chat.openSource')}
                        </Button>
                      )}
                    </div>
                    <div className="lg:hidden flex-shrink-0">
                      <SourceSelector
                        sources={sources}
                        activeSources={activeSources}
                        onSourceChange={onSourceChange}
                      />
                    </div>
                  </div>
                </div>

                <div dir="ltr" className="chat-ltr">
                  {messages.map((message) => {
                    const feedbackEligible = isFeedbackEligibleMessage(message);
                    return (
                      <ChatMessageComponent
                        key={message.id}
                        message={message}
                        userAvatarUrl={userAvatarUrl}
                        onCitationClick={(citation) =>
                          void handleCitationClick(citation, message.question || '')
                        }
                        onFeedbackSubmit={
                          feedbackEligible && onSubmitMessageFeedback
                            ? (feedback) => onSubmitMessageFeedback(message.id, feedback)
                            : undefined
                        }
                        showFeedback={feedbackEligible}
                        feedbackIsBlocking={message.id === pendingFeedbackMessageId}
                        isStreaming={message.isStreaming}
                        onPatientContextIndicatorClick={focusPatientContextPanel}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {showScrollButton && (
              <div className="absolute bottom-32 start-1/2 -translate-x-1/2 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow-lg"
                  onClick={() => scrollToBottom('smooth')}
                >
                  <ChevronDown className="h-4 w-4 me-1" />
                  {t('chat.scrollToBottom')}
                </Button>
              </div>
            )}
          </>
        )}

        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(canEndTest || completedRatedTurns > 0) && (
                  <p className="text-xs text-muted-foreground">
                    {t('chat.completedRatedAnswers')}{' '}
                    <span className="font-medium text-foreground">{completedRatedTurns}</span>
                    <span className="text-muted-foreground/80"> / {checkpointTurnTarget}</span>
                  </p>
                )}
                {isGuest && (
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                      guestQuestionCount >= guestQuestionLimit
                        ? 'border-clinical-caution/50 bg-clinical-caution/10 text-clinical-caution'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {t('chat.guestQuestions')} {guestQuestionCount}/{guestQuestionLimit}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs xl:hidden"
                onClick={() => setMobilePatientContextOpen(true)}
              >
                <SlidersHorizontal className="me-1.5 h-3.5 w-3.5" />
                {t('chat.patientContext')}
              </Button>
            </div>
            {sessionEnded && sessionEndSummary && (
              <div className="mb-3 rounded-lg border border-border bg-muted/35 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{t('chat.sessionSummarySaved')}</p>
                  <span className="rounded-full border border-clinical-success/35 bg-clinical-success/10 px-2 py-0.5 text-[11px] font-medium text-clinical-success">
                    {t('common.recorded')}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sessionEndSummary.overallRating > 0 && (
                    <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {t('chat.overall')} {sessionEndSummary.overallRating}/5
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${workflowFitClasses(
                      sessionEndSummary.workflowFit
                    )}`}
                  >
                    {workflowFitLabel(sessionEndSummary.workflowFit, t)}
                  </span>
                  <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground">
                    {t('chat.endedVia')} {endTriggerLabel(sessionEndSummary.endTrigger, t)}
                  </span>
                </div>

                <p className="mt-2 text-muted-foreground">
                  {t('chat.submitted')}{' '}
                  <span className="font-medium text-foreground">
                    {new Date(sessionEndSummary.completedAt).toLocaleString()}
                  </span>
                </p>

                {sessionEndSummary.notes && (
                  <div className="mt-2 rounded-md border border-border bg-background p-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {t('common.notes')}
                    </p>
                    <p className="mt-1 text-foreground">{sessionEndSummary.notes}</p>
                  </div>
                )}
                {sessionEndSummary.featureVoteLabels.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {t('chat.featureVotes')}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {sessionEndSummary.featureVoteLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <ChatInput
                  onSend={onSendMessage}
                  onTranscribeAudio={onTranscribeAudio}
                  isLoading={isLoading}
                  disabled={inputDisabled}
                  blockedReason={effectiveBlockedReason}
                  placeholder={
                    chatDisabledReason
                      ? t('chat.placeholderNewChat')
                      : effectiveBlockedReason
                        ? t('chat.placeholderRateFirst')
                        : t('chat.placeholderDefault')
                  }
                />
              </div>
              {canEndTest && !sessionEnded && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mb-6 h-10 shrink-0 px-3"
                  onClick={onEndTest}
                >
                  {t('chat.endTest')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {patientSidebarOpen ? (
        <aside
          ref={patientSidebarRef}
          tabIndex={-1}
          style={{ width: patientSidebarWidth }}
          className={cn(
            'relative hidden shrink-0 border-s border-border bg-card/40 outline-none transition-shadow xl:flex',
            patientSidebarFocused && 'ring-2 ring-primary/40 ring-inset shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]'
          )}
        >
          <div
            className="absolute inset-y-0 start-0 z-10 w-1.5 cursor-col-resize bg-transparent transition hover:bg-border/60"
            onPointerDown={handlePatientResizeStart}
          />
          <div className="absolute start-2 top-2 z-10">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setPatientSidebarOpen(false)}
              title={t('chat.hidePatientContext')}
            >
              <PanelLeftClose className="h-4 w-4" />
              <span className="sr-only">{t('chat.hidePatientContext')}</span>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 pt-12">
            <PatientContextPanel
              context={patientContext}
              onChange={onPatientContextChange}
              disabled={Boolean(isLoading)}
            />
          </div>
        </aside>
      ) : (
        <div className="hidden w-12 shrink-0 flex-col items-start border-s border-border bg-card/40 py-2 ps-1 xl:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setPatientSidebarOpen(true);
              setPatientSidebarFocused(true);
            }}
            title={t('chat.showPatientContext')}
          >
            <PanelRightOpen className="h-4 w-4" />
            <span className="sr-only">{t('chat.showPatientContext')}</span>
          </Button>
        </div>
      )}

      <Dialog open={mobileSourceViewerOpen} onOpenChange={setMobileSourceViewerOpen}>
        <DialogContent className="h-[86vh] max-w-3xl overflow-hidden p-0">
          <SourceViewerPanel
            citation={selectedCitation}
            onClose={closeSourceViewer}
            isOpen={Boolean(selectedCitation)}
            className="h-full border-e-0"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={mobilePatientContextOpen} onOpenChange={setMobilePatientContextOpen}>
        <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-2xl">
          <PatientContextPanel
            context={patientContext}
            onChange={onPatientContextChange}
            disabled={Boolean(isLoading)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
