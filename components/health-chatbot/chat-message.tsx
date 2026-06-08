'use client';
import { cn } from '@/lib/utils';
import type { ChatMessage, Citation, FeedbackRating } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { CitationChip } from './citation-chip';
import { User, Bot, AlertTriangle, CheckCircle2, Info, SlidersHorizontal } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

interface ChatMessageProps {
  message: ChatMessage;
  userAvatarUrl?: string;
  onCitationClick?: (citation: Citation) => void;
  onFeedbackSubmit?: (feedback: { rating: FeedbackRating; notes: string }) => void;
  showFeedback?: boolean;
  feedbackIsBlocking?: boolean;
  isStreaming?: boolean;
  onPatientContextIndicatorClick?: () => void;
}

const RTL_CHAR_RE = /[\u0590-\u08FF]/g;
const LATIN_CHAR_RE = /[A-Za-z]/g;

function contentDirection(text: string): 'rtl' | 'ltr' {
  const value = String(text || '');
  const rtlCount = (value.match(RTL_CHAR_RE) || []).length;
  const latinCount = (value.match(LATIN_CHAR_RE) || []).length;
  return rtlCount > latinCount ? 'rtl' : 'ltr';
}

function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let inNumberedList = false;
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      if (inList || inNumberedList) {
        elements.push(
          inNumberedList
            ? <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1.5 my-3 ms-1">{listItems}</ol>
            : <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1.5 my-3 ms-1">{listItems}</ul>
        );
        listItems = [];
        inList = false;
        inNumberedList = false;
      }
      elements.push(
        <h3 key={index} className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0">
          {formatInlineText(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('> ')) {
      if (inList || inNumberedList) {
        elements.push(
          inNumberedList
            ? <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1.5 my-3 ms-1">{listItems}</ol>
            : <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1.5 my-3 ms-1">{listItems}</ul>
        );
        listItems = [];
        inList = false;
        inNumberedList = false;
      }
      elements.push(
        <blockquote key={index} className="border-s-2 border-clinical-info ps-4 py-2 my-3 bg-muted/50 rounded-e-md">
          <p className="text-sm text-muted-foreground italic">{formatInlineText(trimmed.slice(2))}</p>
        </blockquote>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inNumberedList) {
        elements.push(
          <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1.5 my-3 ms-1">{listItems}</ol>
        );
        listItems = [];
        inNumberedList = false;
      }
      inList = true;
      listItems.push(
        <li key={index} className="text-sm leading-relaxed">
          {formatInlineText(trimmed.slice(2))}
        </li>
      );
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+/);
    if (numberedMatch) {
      if (inList) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1.5 my-3 ms-1">{listItems}</ul>
        );
        listItems = [];
        inList = false;
      }
      inNumberedList = true;
      listItems.push(
        <li key={index} className="text-sm leading-relaxed">
          {formatInlineText(trimmed.slice(numberedMatch[0].length))}
        </li>
      );
      return;
    }

    if (inList || inNumberedList) {
      elements.push(
        inNumberedList
          ? <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-1.5 my-3 ms-1">{listItems}</ol>
          : <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1.5 my-3 ms-1">{listItems}</ul>
      );
      listItems = [];
      inList = false;
      inNumberedList = false;
    }

    if (trimmed === '') {
      return;
    }

    elements.push(
      <p key={index} className="text-sm leading-relaxed my-2 first:mt-0 last:mb-0">
        {formatInlineText(trimmed)}
      </p>
    );
  });

  if (listItems.length > 0) {
    elements.push(
      inNumberedList
        ? <ol key={`list-${listKey}`} className="list-decimal list-inside space-y-1.5 my-3 ms-1">{listItems}</ol>
        : <ul key={`list-${listKey}`} className="list-disc list-inside space-y-1.5 my-3 ms-1">{listItems}</ul>
    );
  }

  return elements;
}

function formatInlineText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export const ChatMessageComponent = memo(function ChatMessageComponent({
  message,
  userAvatarUrl,
  onCitationClick,
  onFeedbackSubmit,
  showFeedback = false,
  feedbackIsBlocking = false,
  isStreaming,
  onPatientContextIndicatorClick,
}: ChatMessageProps) {
  const { t } = useI18n();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const dir = contentDirection(message.content);
  const isRtl = dir === 'rtl';
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(
    message.feedback?.rating ?? null
  );
  const [feedbackNotes, setFeedbackNotes] = useState(message.feedback?.notes ?? '');

  const feedbackOptions = useMemo(
    () => [
      { value: 1 as FeedbackRating, label: t('chat.feedbackVeryPoor') },
      { value: 2 as FeedbackRating, label: t('chat.feedbackPoor') },
      { value: 3 as FeedbackRating, label: t('chat.feedbackFair') },
      { value: 4 as FeedbackRating, label: t('chat.feedbackGood') },
      { value: 5 as FeedbackRating, label: t('chat.feedbackExcellent') },
    ],
    [t]
  );

  useEffect(() => {
    setSelectedRating(message.feedback?.rating ?? null);
    setFeedbackNotes(message.feedback?.notes ?? '');
  }, [message.feedback?.notes, message.feedback?.rating, message.id]);

  const handleFeedbackSubmit = () => {
    if (!selectedRating || !onFeedbackSubmit) {
      return;
    }
    onFeedbackSubmit({
      rating: selectedRating,
      notes: feedbackNotes,
    });
  };

  if (isSystem) {
    return (
      <div dir="ltr" className="chat-ltr flex justify-center py-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className={cn('chat-ltr flex gap-3 py-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'flex flex-shrink-0 items-center gap-1.5',
          isUser ? 'w-auto' : 'w-12 justify-center'
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {isUser ? (
            userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={t('chat.userAvatarAlt')}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="h-4 w-4" />
            )
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
        {isUser && (
          <button
            type="button"
            onClick={() => onPatientContextIndicatorClick?.()}
            disabled={!onPatientContextIndicatorClick}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2',
              message.patientContextEnabled
                ? 'border-clinical-success/50 bg-clinical-success/20 text-clinical-success hover:bg-clinical-success/30'
                : 'border-border bg-muted text-muted-foreground hover:bg-accent/70 dark:hover:bg-accent/40 hover:text-foreground dark:hover:text-foreground',
              !onPatientContextIndicatorClick && 'cursor-default opacity-80'
            )}
            title={
              message.patientContextEnabled
                ? t('chat.patientContextEnabledTitle')
                : t('chat.patientContextDisabledTitle')
            }
            aria-label={
              message.patientContextEnabled
                ? t('chat.patientContextEnabledAria')
                : t('chat.patientContextDisabledAria')
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only">
              {message.patientContextEnabled
                ? t('chat.patientContextEnabled')
                : t('chat.patientContextDisabled')}
            </span>
          </button>
        )}
      </div>

      <div className={cn('flex-1 min-w-0', isRtl ? 'text-end' : 'text-start')}>
        <div className={cn('text-xs font-medium text-muted-foreground mb-1', isUser ? 'pe-1' : 'ps-1')}>
          {isUser ? t('chat.you') : t('chat.clinicalAssistant')}
        </div>

        <div
          className={cn(
            'inline-block max-w-[85%] rounded-xl px-4 py-3',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border',
            isRtl ? 'text-end' : 'text-start',
            isStreaming && !isUser && 'animate-pulse-subtle'
          )}
          dir={dir}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed" dir={dir}>
              {message.content}
            </p>
          ) : (
            <div className={cn('prose prose-sm dark:prose-invert max-w-none', isRtl && 'text-end')} dir={dir}>
              {formatMessageContent(message.content)}
              {isStreaming && <span className="inline-block w-1.5 h-4 bg-primary ms-0.5 animate-pulse" />}
            </div>
          )}
        </div>

        {message.safetyFiltered && (
          <div
            className={cn(
              'mt-2 max-w-[85%] inline-flex items-start gap-2 px-3 py-2 bg-clinical-caution/10 border border-clinical-caution/20 rounded-lg',
              isRtl ? 'text-end' : 'text-start'
            )}
            dir={dir}
          >
            <AlertTriangle className="h-4 w-4 text-clinical-caution flex-shrink-0 mt-0.5" />
            <p className="text-xs text-clinical-caution">
              {message.safetyFilterReason || t('chat.safetyFilteredDefault')}
            </p>
          </div>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className={cn('mt-3 max-w-[85%]', isUser ? 'ms-auto' : '')}>
            <div className="text-xs text-muted-foreground mb-1.5 ps-1">{t('chat.sourcesCited')}</div>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((citation, index) => (
                <CitationChip
                  key={citation.id}
                  citation={citation}
                  index={index + 1}
                  onClick={() => onCitationClick?.(citation)}
                />
              ))}
            </div>
          </div>
        )}

        {!isUser && showFeedback && (
          <div className="mt-3 max-w-[85%] rounded-lg border border-border bg-muted/30 p-3">
            {message.feedback ? (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-clinical-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('chat.feedbackSubmitted')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('chat.rating')}{' '}
                  <span className="font-medium text-foreground">{message.feedback.rating}/5</span>
                </p>
                {message.feedback.notes && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {t('common.notes')}: <span className="text-foreground">{message.feedback.notes}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">{t('chat.rateAnswerRequired')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('chat.rateAnswerHint')}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {feedbackOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedRating(option.value)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition-colors',
                        selectedRating === option.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent/70 dark:hover:bg-accent/40 hover:text-foreground dark:hover:text-foreground'
                      )}
                    >
                      {option.value} - {option.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground" htmlFor={`${message.id}-feedback-note`}>
                    {t('chat.optionalClinicalNotes')}
                  </label>
                  <textarea
                    id={`${message.id}-feedback-note`}
                    value={feedbackNotes}
                    onChange={(event) => setFeedbackNotes(event.target.value)}
                    rows={2}
                    className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                    placeholder={t('chat.feedbackNotesPlaceholder')}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleFeedbackSubmit}
                    disabled={!selectedRating || message.feedbackSaving}
                  >
                    {message.feedbackSaving ? t('common.saving') : t('chat.saveFeedback')}
                  </Button>
                  {feedbackIsBlocking && (
                    <p className="text-[11px] text-clinical-caution">{t('chat.requiredBeforeNext')}</p>
                  )}
                </div>
                {message.feedbackError && (
                  <p className="text-[11px] text-destructive">{message.feedbackError}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className={cn('text-[10px] text-muted-foreground/60 mt-1.5', isRtl ? 'pe-1' : 'ps-1')}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
});
