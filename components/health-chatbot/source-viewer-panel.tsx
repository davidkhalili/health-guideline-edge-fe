'use client';

import { cn } from '@/lib/utils';
import type { Citation } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { X, Copy, Check, FileText, Hash, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface SourceViewerPanelProps {
  citation: Citation | null;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

export function SourceViewerPanel({ citation, onClose, isOpen, className }: SourceViewerPanelProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const sectionDisplay = citation
    ? citation.sectionPathLabel?.trim() ||
      citation.sectionPath?.filter(Boolean).join(' > ') ||
      citation.sectionTitle
    : '';

  const handleCopy = async () => {
    if (citation) {
      await navigator.clipboard.writeText(citation.chunkText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderHighlightedText = () => {
    if (!citation) return null;

    const text = citation.chunkText;
    const spans = citation.highlightedSpans || [];

    if (spans.length === 0) {
      return <p className="text-sm leading-relaxed text-foreground">{text}</p>;
    }

    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    spans.forEach((span, index) => {
      if (span.start > lastEnd) {
        elements.push(
          <span key={`pre-${index}`} className="text-foreground">
            {text.slice(lastEnd, span.start)}
          </span>
        );
      }

      elements.push(
        <mark
          key={`mark-${index}`}
          className="bg-primary/20 text-foreground px-0.5 rounded citation-highlight underline decoration-primary/70 font-semibold"
        >
          {text.slice(span.start, span.end)}
        </mark>
      );

      lastEnd = span.end;
    });

    if (lastEnd < text.length) {
      elements.push(
        <span key="post" className="text-foreground">
          {text.slice(lastEnd)}
        </span>
      );
    }

    return <p className="text-sm leading-relaxed">{elements}</p>;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={cn('h-full flex flex-col', className)}
      style={{ background: 'var(--window-chrome)', borderColor: 'var(--window-border)' }}
      role="dialog"
      aria-label={t('chat.sourceViewer')}
    >
      {/* OS-style titlebar */}
      <div
        className="os-titlebar flex-shrink-0"
        style={{ borderBottom: '1px solid var(--window-border)' }}
      >
        <div className="os-traffic-lights">
          <button
            type="button"
            className="os-traffic-light os-traffic-light-close"
            onClick={onClose}
            aria-label={t('chat.closeSourceViewer')}
          />
          <span className="os-traffic-light os-traffic-light-minimize" />
          <span className="os-traffic-light os-traffic-light-maximize" />
        </div>
        <div className="os-titlebar-drag flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--ink)' }}>
          <BookOpen className="h-3.5 w-3.5" style={{ color: 'var(--amber-dark)' }} />
          {t('chat.sourceViewerTitle')}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 ms-auto" style={{ color: 'var(--ink-light)' }}>
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">{t('chat.closeSourceViewer')}</span>
        </Button>
      </div>

      {citation ? (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-foreground truncate">{citation.sourceTitle}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">{citation.sectionId}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              {t('chat.sectionPath')}
            </p>
            <p className="text-sm font-medium text-foreground break-words">
              {sectionDisplay || t('common.general')}
            </p>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {t('chat.sourceText')}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 me-1" />
                      {t('common.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 me-1" />
                      {t('common.copy')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ background: 'var(--paper)', border: '1px solid var(--window-border)' }}>{renderHighlightedText()}</div>

            {citation.relevanceScore && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('chat.relevance')}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-clinical-success rounded-full transition-all"
                    style={{ width: `${citation.relevanceScore * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(citation.relevanceScore * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t('chat.selectCitation')}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
