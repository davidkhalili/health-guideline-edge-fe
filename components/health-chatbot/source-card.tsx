'use client';

import type { BuildProgress, KnowledgeSource } from '@/lib/types';
import type { TranslateFn } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  Eye,
  FilePlus2,
  FileText,
  Globe,
  Loader2,
  MapPin,
  Trash2,
  XCircle,
} from 'lucide-react';

interface SourceCardProps {
  source: KnowledgeSource;
  buildProgress?: BuildProgress;
  canDelete?: boolean;
  canPreview?: boolean;
  canAddDocument?: boolean;
  onRequestPreview?: () => void;
  onRequestAddDocument?: () => void;
  previewDisabledReason?: string;
  addDocumentDisabledReason?: string;
  onRequestDelete?: () => void;
  deleteDisabledReason?: string;
  isDeleting?: boolean;
}

function scopeIcon(scopeType: KnowledgeSource['scopeType']) {
  if (scopeType === 'global') {
    return <Globe className="h-5 w-5" />;
  }
  if (scopeType === 'country') {
    return <MapPin className="h-5 w-5" />;
  }
  if (scopeType === 'regional') {
    return <Building2 className="h-5 w-5" />;
  }
  return <FileText className="h-5 w-5" />;
}

function scopeTypeLabel(scopeType: KnowledgeSource['scopeType'], t: TranslateFn): string {
  if (scopeType === 'country') return t('sources.scopeCountry');
  if (scopeType === 'global') return t('sources.scopeGlobal');
  if (scopeType === 'regional') return t('sources.scopeRegional');
  return t('sources.scopeCustom');
}

function statusBadge(status: KnowledgeSource['status'], t: TranslateFn) {
  if (status === 'ready') {
    return (
      <Badge variant="outline" className="bg-clinical-success/10 text-clinical-success border-clinical-success/20">
        <Check className="h-3 w-3 me-1" />
        {t('sourceSelector.statusReady')}
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
        <XCircle className="h-3 w-3 me-1" />
        {t('sourceSelector.statusFailed')}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-clinical-warning/10 text-clinical-warning border-clinical-warning/20">
      <Clock className="h-3 w-3 me-1" />
      {t('sourceSelector.statusPending')}
    </Badge>
  );
}

export function SourceCard({
  source,
  buildProgress,
  canDelete = false,
  canPreview = false,
  canAddDocument = false,
  onRequestPreview,
  onRequestAddDocument,
  previewDisabledReason = '',
  addDocumentDisabledReason = '',
  onRequestDelete,
  deleteDisabledReason = '',
  isDeleting = false,
}: SourceCardProps) {
  const { t } = useI18n();
  const deleteDisabled = Boolean(deleteDisabledReason) || isDeleting || !onRequestDelete;
  const previewDisabled = Boolean(previewDisabledReason) || !onRequestPreview;
  const addDocumentDisabled = Boolean(addDocumentDisabledReason) || !onRequestAddDocument;

  const isBuilding =
    source.status !== 'ready' &&
    Boolean(buildProgress) &&
    (buildProgress?.state === 'running' || buildProgress?.state === 'idle');
  const buildErrored = buildProgress?.state === 'error';
  const buildPercent = Math.max(0, Math.min(100, Math.round(buildProgress?.percent ?? 0)));

  return (
    <Card className="transition-all duration-200 hover:border-muted-foreground/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
              {scopeIcon(source.scopeType)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground truncate">{source.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {scopeTypeLabel(source.scopeType, t)} - {source.scopeValue || t('common.unspecified')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(source.status, t)}
            {canPreview && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRequestPreview?.()}
                disabled={previewDisabled}
                title={previewDisabledReason || t('sources.previewIngestion')}
                className="h-7 w-7"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">{t('sources.previewIngestionSr')}</span>
              </Button>
            )}
            {canAddDocument && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRequestAddDocument?.()}
                disabled={addDocumentDisabled}
                title={addDocumentDisabledReason || t('sources.addDocumentToRag')}
                className="h-7 w-7"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                <span className="sr-only">{t('sources.addDocumentToRagSr')}</span>
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRequestDelete?.()}
                disabled={deleteDisabled}
                title={deleteDisabledReason || t('sources.deleteSource')}
                className="h-7 w-7 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">{t('sources.deleteSourceSr')}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isBuilding && (
          <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                {t('sources.buildingRagIndex')}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{buildPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${buildPercent}%` }}
              />
            </div>
            {buildProgress?.message && (
              <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{buildProgress.message}</p>
            )}
          </div>
        )}

        {buildErrored && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span className="min-w-0">
              <span className="font-medium">{t('sources.buildFailed')}</span>{' '}
              <span className="break-words">
                {buildProgress?.error || buildProgress?.message || t('sources.unknownError')}
              </span>
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 bg-muted/50 rounded-lg">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('sources.documentsLabel')}
            </p>
            <p className="text-lg font-semibold text-foreground">{source.documentCount}</p>
          </div>
          <div className="p-2.5 bg-muted/50 rounded-lg">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('sources.chunksLabel')}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {source.chunkCount?.toLocaleString() ?? '-'}
            </p>
          </div>
        </div>
        {source.embeddingModel && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{t('sources.embedding')}</span>
            <code className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{source.embeddingModel}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
