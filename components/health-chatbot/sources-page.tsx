'use client';

import { useMemo, useState } from 'react';
import type {
  BuildProgress,
  KnowledgeSource,
  SourceDocument,
  SourceDocumentsData,
  SourceIngestionPreviewData,
  SourceRebuildSettings,
} from '@/lib/types';
import type { TranslateFn } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SourceCard } from './source-card';
import { UploadSourceModal } from './upload-source-modal';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileWarning,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Table,
  Trash2,
} from 'lucide-react';

interface SourcesPageProps {
  sources: KnowledgeSource[];
  buildProgressById?: Record<string, BuildProgress>;
  canUpload?: boolean;
  canDelete?: boolean;
  canPreview?: boolean;
  isRefreshing?: boolean;
  onRefresh: () => Promise<void> | void;
  onUpload: (payload: {
    title: string;
    scopeType: KnowledgeSource['scopeType'];
    scopeValue: string;
    files: File[];
  }) => Promise<void>;
  onAddDocument?: (source: KnowledgeSource, payload: { title: string; file: File }) => Promise<void>;
  onDelete?: (source: KnowledgeSource) => Promise<void>;
  onViewSourceDocuments?: (source: KnowledgeSource) => Promise<SourceDocumentsData>;
  onDeleteSourceDocument?: (source: KnowledgeSource, document: SourceDocument) => Promise<void>;
  onViewIngestionPreview?: (source: KnowledgeSource) => Promise<SourceIngestionPreviewData>;
  onRebuildSource?: (source: KnowledgeSource, settings: SourceRebuildSettings) => Promise<void>;
}

function scopeTypeLabel(scopeType: KnowledgeSource['scopeType'], t: TranslateFn): string {
  if (scopeType === 'country') return t('sources.scopeCountry');
  if (scopeType === 'global') return t('sources.scopeGlobal');
  if (scopeType === 'regional') return t('sources.scopeRegional');
  return t('sources.scopeCustom');
}

export function SourcesPage({
  sources,
  buildProgressById = {},
  canUpload = false,
  canDelete = false,
  canPreview = false,
  isRefreshing = false,
  onRefresh,
  onUpload,
  onAddDocument,
  onDelete,
  onViewSourceDocuments,
  onDeleteSourceDocument,
  onViewIngestionPreview,
  onRebuildSource,
}: SourcesPageProps) {
  const { t } = useI18n();
  const defaultRebuildSettings: SourceRebuildSettings = {
    parserMode: 'auto',
    enableDocling: false,
    enableOcr: true,
    includeAppendices: false,
    outputMarkdown: true,
    embeddingModel: 'BAAI/bge-m3',
    maxRetrievalChunkTokens: 600,
    maxParentChunkTokens: 1500,
    chunkOverlapTokens: 80,
    adminPreviewChunkCount: 20,
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'country' | 'global' | 'regional' | 'custom'>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false);
  const [sourcePendingDocument, setSourcePendingDocument] = useState<KnowledgeSource | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUploadError, setDocumentUploadError] = useState('');
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourcePendingDelete, setSourcePendingDelete] = useState<KnowledgeSource | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingSourceId, setDeletingSourceId] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewSourceId, setPreviewSourceId] = useState('');
  const [previewData, setPreviewData] = useState<SourceIngestionPreviewData | null>(null);
  const [sourceDocuments, setSourceDocuments] = useState<SourceDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [deletingDocumentId, setDeletingDocumentId] = useState('');
  const [rebuildSettings, setRebuildSettings] = useState<SourceRebuildSettings>(defaultRebuildSettings);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState('');
  const [rebuildMessageIsError, setRebuildMessageIsError] = useState(false);

  const filteredSources = useMemo(
    () =>
      sources.filter((source) => {
        const haystack = `${source.title} ${source.scopeValue}`.toLowerCase();
        const matchesSearch = haystack.includes(searchQuery.toLowerCase());
        const matchesScope = scopeFilter === 'all' || source.scopeType === scopeFilter;
        return matchesSearch && matchesScope;
      }),
    [scopeFilter, searchQuery, sources]
  );

  const statusCounts = useMemo(
    () => ({
      ready: sources.filter((source) => source.status === 'ready').length,
      pending: sources.filter((source) => source.status === 'pending').length,
      failed: sources.filter((source) => source.status === 'failed').length,
    }),
    [sources]
  );

  const openDeleteDialog = (source: KnowledgeSource) => {
    setDeleteError('');
    setSourcePendingDelete(source);
    setDeleteDialogOpen(true);
  };

  const openAddDocumentDialog = (source: KnowledgeSource) => {
    setDocumentUploadError('');
    setDocumentTitle('');
    setDocumentFile(null);
    setSourcePendingDocument(source);
    setAddDocumentDialogOpen(true);
  };

  const closeAddDocumentDialog = (nextOpen: boolean) => {
    if (!nextOpen && !isAddingDocument) {
      setDocumentUploadError('');
      setDocumentTitle('');
      setDocumentFile(null);
      setSourcePendingDocument(null);
    }
    setAddDocumentDialogOpen(nextOpen);
  };

  const handleAddDocument = async () => {
    if (!onAddDocument || !sourcePendingDocument || !documentFile || isAddingDocument) {
      return;
    }
    setIsAddingDocument(true);
    setDocumentUploadError('');
    try {
      await onAddDocument(sourcePendingDocument, {
        title: documentTitle.trim() || documentFile.name.replace(/\.pdf$/i, ''),
        file: documentFile,
      });
      setAddDocumentDialogOpen(false);
      setSourcePendingDocument(null);
      setDocumentTitle('');
      setDocumentFile(null);
    } catch (error) {
      setDocumentUploadError(error instanceof Error ? error.message : t('chat.addDocumentFailed'));
    } finally {
      setIsAddingDocument(false);
    }
  };

  const closeDeleteDialog = () => {
    if (deletingSourceId) {
      return;
    }
    setDeleteDialogOpen(false);
    setSourcePendingDelete(null);
    setDeleteError('');
  };

  const handleDeleteSource = async () => {
    if (!sourcePendingDelete || !onDelete) {
      return;
    }
    setDeleteError('');
    setDeletingSourceId(sourcePendingDelete.id);
    try {
      await onDelete(sourcePendingDelete);
      setDeleteDialogOpen(false);
      setSourcePendingDelete(null);
      setDeleteError('');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t('chat.deleteSourceFailed'));
    } finally {
      setDeletingSourceId('');
    }
  };

  const openPreviewDialog = async (source: KnowledgeSource) => {
    if (!onViewIngestionPreview) {
      return;
    }
    setPreviewDialogOpen(true);
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewSourceId(source.id);
    setPreviewData(null);
    setSourceDocuments([]);
    setDocumentsError('');
    setDocumentsLoading(Boolean(onViewSourceDocuments));
    setRebuildSettings(defaultRebuildSettings);
    setRebuildMessage('');
    setRebuildMessageIsError(false);
    try {
      const [data, documentsData] = await Promise.all([
        onViewIngestionPreview(source),
        onViewSourceDocuments ? onViewSourceDocuments(source) : Promise.resolve(null),
      ]);
      setPreviewData(data);
      if (documentsData) {
        setSourceDocuments(documentsData.documents);
      }
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : t('chat.loadPreviewFailed'));
    } finally {
      setPreviewLoading(false);
      setDocumentsLoading(false);
    }
  };

  const refreshSourceDocuments = async (source: KnowledgeSource) => {
    if (!onViewSourceDocuments) {
      return;
    }
    setDocumentsLoading(true);
    setDocumentsError('');
    try {
      const documentsData = await onViewSourceDocuments(source);
      setSourceDocuments(documentsData.documents);
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : t('chat.loadDocumentsFailed'));
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDeleteDocument = async (document: SourceDocument) => {
    if (!previewSourceForActions || !onDeleteSourceDocument || deletingDocumentId) {
      return;
    }
    setDeletingDocumentId(document.id);
    setDocumentsError('');
    try {
      await onDeleteSourceDocument(previewSourceForActions, document);
      await refreshSourceDocuments(previewSourceForActions);
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : t('chat.deleteDocumentFailed'));
    } finally {
      setDeletingDocumentId('');
    }
  };

  const handleRebuild = async () => {
    if (!previewSourceForActions || !onRebuildSource || isRebuilding) {
      return;
    }
    setIsRebuilding(true);
    setRebuildMessage('');
    setRebuildMessageIsError(false);
    try {
      await onRebuildSource(previewSourceForActions, rebuildSettings);
      const refreshed = onViewIngestionPreview
        ? await onViewIngestionPreview(previewSourceForActions)
        : null;
      if (refreshed) {
        setPreviewData(refreshed);
      }
      setRebuildMessage(t('chat.rebuildCompleted'));
      setRebuildMessageIsError(false);
    } catch (error) {
      setRebuildMessage(error instanceof Error ? error.message : t('chat.rebuildFailed'));
      setRebuildMessageIsError(true);
    } finally {
      setIsRebuilding(false);
    }
  };

  const getNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return fallback;
  };

  const getStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  };

  const getRecord = (value: unknown): Record<string, unknown> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  };

  const getRecordArray = (value: unknown): Array<Record<string, unknown>> => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => getRecord(item))
      .filter((item) => Object.keys(item).length > 0);
  };

  const previewSourceForActions = previewSourceId
    ? sources.find((source) => source.id === previewSourceId) ?? null
    : null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('sources.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('sources.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void onRefresh()} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 me-2" />
              )}
              {t('common.refresh')}
            </Button>
            {canUpload && (
              <Button onClick={() => setUploadModalOpen(true)}>
                <Plus className="h-4 w-4 me-2" />
                {t('sources.addSource')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('sources.total')}</span>
            <span className="font-medium">{sources.length}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('sources.ready')}</span>
            <span className="font-medium">{statusCounts.ready}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('sources.pending')}</span>
            <span className="font-medium">{statusCounts.pending}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('sources.failed')}</span>
            <span className="font-medium">{statusCounts.failed}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('sources.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="ps-9"
            />
          </div>
          <Tabs value={scopeFilter} onValueChange={(value) => setScopeFilter(value as typeof scopeFilter)}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">
                {t('sources.filterAll')}
              </TabsTrigger>
              <TabsTrigger value="country" className="text-xs">
                {t('sources.filterCountry')}
              </TabsTrigger>
              <TabsTrigger value="global" className="text-xs">
                {t('sources.filterGlobal')}
              </TabsTrigger>
              <TabsTrigger value="regional" className="text-xs">
                {t('sources.filterRegional')}
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                {t('sources.filterCustom')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t('sources.noSourcesFound')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{t('sources.noSourcesHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                buildProgress={buildProgressById[source.id]}
                canPreview={canPreview}
                canAddDocument={canUpload && Boolean(onAddDocument)}
                onRequestPreview={
                  onViewIngestionPreview ? () => void openPreviewDialog(source) : undefined
                }
                onRequestAddDocument={
                  onAddDocument ? () => openAddDocumentDialog(source) : undefined
                }
                previewDisabledReason={
                  source.status !== 'ready' ? t('sources.previewAfterBuild') : ''
                }
                addDocumentDisabledReason={
                  source.status !== 'ready' ? t('sources.addDocAfterBuild') : ''
                }
                canDelete={canDelete}
                onRequestDelete={() => openDeleteDialog(source)}
                deleteDisabledReason={
                  source.id === 'default-guideline-source' ? t('sources.defaultSourceNoDelete') : ''
                }
                isDeleting={deletingSourceId === source.id}
              />
            ))}
          </div>
        )}
      </div>

      <UploadSourceModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={onUpload}
      />

      <Dialog open={addDocumentDialogOpen} onOpenChange={closeAddDocumentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('sources.addDocumentTitle')}</DialogTitle>
            <DialogDescription>
              {t('sources.addDocumentDesc', {
                title:
                  sourcePendingDocument?.title ||
                  sourcePendingDocument?.scopeValue ||
                  t('common.unspecified'),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {t('sources.addDocumentHint')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-document-file">{t('sources.pdfFile')}</Label>
              <Input
                id="collection-document-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setDocumentFile(nextFile);
                  if (nextFile && !documentTitle.trim()) {
                    setDocumentTitle(nextFile.name.replace(/\.pdf$/i, ''));
                  }
                }}
                disabled={isAddingDocument}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-document-title">{t('sources.documentTitle')}</Label>
              <Input
                id="collection-document-title"
                placeholder={t('sources.documentTitlePlaceholder')}
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                disabled={isAddingDocument}
              />
            </div>

            {documentUploadError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{documentUploadError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeAddDocumentDialog(false)}
              disabled={isAddingDocument}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => void handleAddDocument()}
              disabled={!documentFile || isAddingDocument}
            >
              {isAddingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('common.adding')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 me-2" />
                  {t('sources.addAndRebuild')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {t('sources.previewTitle')}
            </DialogTitle>
            <DialogDescription>{t('sources.previewDesc')}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] overflow-y-auto pe-1">
            {previewLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('sources.loadingPreview')}
              </div>
            ) : previewError ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{previewError}</span>
              </div>
            ) : (
              <>
                {(() => {
                  const report = getRecord(previewData?.ingestionReport);
                  const preview = getRecord(previewData?.adminPreview);
                  const warnings = [
                    ...getStringArray(report.warnings),
                    ...getStringArray(previewData?.warnings),
                  ];
                  const sectionTree = getRecordArray(preview.section_tree);
                  const chunkPreview = getRecordArray(preview.chunk_preview);
                  const tableExamples = getRecordArray(preview.table_examples);
                  const lowConfidenceHeadings = getRecordArray(preview.low_confidence_heading_examples);
                  const suspiciousChunks = getRecordArray(preview.suspicious_chunks);
                  const extractionIssues = getRecordArray(preview.pages_with_extraction_issues);
                  const removedHeaderFooters = getRecordArray(report.removed_headers_footers);
                  const headingLevels = getRecord(report.heading_levels);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.parser')}</p>
                          <p className="truncate text-sm font-semibold text-foreground">
                            {String(report.parser_used ?? t('common.unknown'))}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.languages')}</p>
                          <p className="text-sm font-semibold text-foreground">
                            {getStringArray(report.detected_languages).join(', ') || '-'}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.pages')}</p>
                          <p className="text-sm font-semibold text-foreground">{getNumber(report.page_count)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.confidence')}</p>
                          <p className="text-sm font-semibold text-foreground">
                            {String(report.confidence_score ?? '-')}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.headings')}</p>
                          <p className="text-sm font-semibold text-foreground">{getNumber(report.num_headings)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.tables')}</p>
                          <p className="text-sm font-semibold text-foreground">{getNumber(report.num_tables)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.chunks')}</p>
                          <p className="text-sm font-semibold text-foreground">{getNumber(report.num_chunks)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('sources.avgChunkTokens')}</p>
                          <p className="text-sm font-semibold text-foreground">
                            {getNumber(report.avg_chunk_tokens)}
                          </p>
                        </div>
                      </div>

                      {!previewData?.available && (
                        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                          {t('sources.artifactsUnavailable')}
                        </div>
                      )}

                      {warnings.length > 0 && (
                        <div className="rounded-md border border-clinical-warning/30 bg-clinical-warning/10 px-3 py-2">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-clinical-warning">
                            {t('sources.warnings')}
                          </p>
                          <ul className="space-y-1 text-xs text-clinical-warning">
                            {warnings.map((warning, index) => (
                              <li key={`${warning}-${index}`}>- {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {canPreview && onRebuildSource && previewSourceForActions && (
                        <div className="rounded-md border border-border bg-muted/20 p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('sources.rebuildWithSettings')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('sources.rebuildLowConfidenceHint')}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleRebuild()}
                              disabled={previewLoading || isRebuilding}
                            >
                              {isRebuilding ? (
                                <>
                                  <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />
                                  {t('common.rebuilding')}
                                </>
                              ) : (
                                t('sources.rebuildSource')
                              )}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label htmlFor="parser-mode" className="text-xs">{t('sources.parserMode')}</Label>
                              <Select
                                value={rebuildSettings.parserMode}
                                onValueChange={(value) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    parserMode: value as SourceRebuildSettings['parserMode'],
                                  }))
                                }
                              >
                                <SelectTrigger id="parser-mode" className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="auto">auto</SelectItem>
                                  <SelectItem value="pymupdf">pymupdf</SelectItem>
                                  <SelectItem value="docling">docling</SelectItem>
                                  <SelectItem value="ocr">ocr</SelectItem>
                                  <SelectItem value="legacy">legacy</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="embedding-model" className="text-xs">{t('sources.embeddingModel')}</Label>
                              <Input
                                id="embedding-model"
                                value={rebuildSettings.embeddingModel}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    embeddingModel: event.target.value,
                                  }))
                                }
                                className="h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="retrieval-tokens" className="text-xs">{t('sources.retrievalChunkTokens')}</Label>
                              <Input
                                id="retrieval-tokens"
                                type="number"
                                min={220}
                                value={rebuildSettings.maxRetrievalChunkTokens}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    maxRetrievalChunkTokens: Math.max(220, Number(event.target.value) || 600),
                                  }))
                                }
                                className="h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="parent-tokens" className="text-xs">{t('sources.parentChunkTokens')}</Label>
                              <Input
                                id="parent-tokens"
                                type="number"
                                min={600}
                                value={rebuildSettings.maxParentChunkTokens}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    maxParentChunkTokens: Math.max(600, Number(event.target.value) || 1500),
                                  }))
                                }
                                className="h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="overlap-tokens" className="text-xs">{t('sources.overlapTokens')}</Label>
                              <Input
                                id="overlap-tokens"
                                type="number"
                                min={0}
                                value={rebuildSettings.chunkOverlapTokens}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    chunkOverlapTokens: Math.max(0, Number(event.target.value) || 80),
                                  }))
                                }
                                className="h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="preview-count" className="text-xs">{t('sources.adminPreviewChunkCount')}</Label>
                              <Input
                                id="preview-count"
                                type="number"
                                min={1}
                                value={rebuildSettings.adminPreviewChunkCount}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    adminPreviewChunkCount: Math.max(1, Number(event.target.value) || 20),
                                  }))
                                }
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={rebuildSettings.enableOcr}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({ ...prev, enableOcr: event.target.checked }))
                                }
                              />
                              {t('sources.enableOcr')}
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={rebuildSettings.enableDocling}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({ ...prev, enableDocling: event.target.checked }))
                                }
                              />
                              {t('sources.enableDocling')}
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={rebuildSettings.includeAppendices}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    includeAppendices: event.target.checked,
                                  }))
                                }
                              />
                              {t('sources.includeAppendices')}
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={rebuildSettings.outputMarkdown}
                                onChange={(event) =>
                                  setRebuildSettings((prev) => ({
                                    ...prev,
                                    outputMarkdown: event.target.checked,
                                  }))
                                }
                              />
                              {t('sources.outputMarkdown')}
                            </label>
                          </div>

                          {rebuildMessage && (
                            <div
                              className={
                                rebuildMessageIsError
                                  ? 'mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'
                                  : 'mt-3 flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs'
                              }
                            >
                              <CheckCircle2
                                className={
                                  rebuildMessageIsError
                                    ? 'mt-0.5 h-3.5 w-3.5 text-destructive'
                                    : 'mt-0.5 h-3.5 w-3.5 text-primary'
                                }
                              />
                              <span className={rebuildMessageIsError ? 'text-destructive' : 'text-muted-foreground'}>
                                {rebuildMessage}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto">
                          <TabsTrigger value="overview" className="text-xs">{t('sources.overview')}</TabsTrigger>
                          <TabsTrigger value="documents" className="text-xs">{t('sources.documents')}</TabsTrigger>
                          <TabsTrigger value="outline" className="text-xs">{t('sources.outline')}</TabsTrigger>
                          <TabsTrigger value="chunks" className="text-xs">{t('sources.chunkPreview')}</TabsTrigger>
                          <TabsTrigger value="tables" className="text-xs">{t('sources.tablesTab')}</TabsTrigger>
                          <TabsTrigger value="quality" className="text-xs">{t('sources.qualityChecks')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-3">
                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('sources.headingLevels')}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {Object.keys(headingLevels).length === 0 ? (
                                <span className="text-muted-foreground">{t('sources.noHeadingLevels')}</span>
                              ) : (
                                Object.entries(headingLevels).map(([level, count]) => (
                                  <span
                                    key={level}
                                    className="rounded-md bg-muted px-2 py-1 font-mono text-foreground"
                                  >
                                    H{level}: {getNumber(count)}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('sources.lowConfidenceHeadings')}
                            </p>
                            {lowConfidenceHeadings.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noLowConfidenceHeadings')}</p>
                            ) : (
                              <div className="space-y-2">
                                {lowConfidenceHeadings.slice(0, 12).map((item, index) => (
                                  <div key={`${index}-${String(item.block_id ?? '')}`} className="rounded bg-muted/40 px-2 py-1.5 text-xs">
                                    <p className="font-medium text-foreground">
                                      p.{getNumber(item.page)} • conf={String(item.confidence ?? '-')}
                                    </p>
                                    <p className="text-muted-foreground">{String(item.text ?? '')}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('sources.removedHeadersFooters')}
                            </p>
                            {removedHeaderFooters.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noHeadersFooters')}</p>
                            ) : (
                              <div className="space-y-2">
                                {removedHeaderFooters.slice(0, 12).map((item, index) => (
                                  <div key={`${index}-${String(item.block_id ?? '')}`} className="rounded bg-muted/40 px-2 py-1.5 text-xs">
                                    <p className="font-medium text-foreground">
                                      p.{getNumber(item.page)} • {String(item.type ?? 'header/footer')}
                                    </p>
                                    <p className="text-muted-foreground">{String(item.text ?? '')}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-3">
                          <div className="rounded-md border border-border p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t('sources.documentsInRag')}
                                </p>
                                <p className="text-xs text-muted-foreground">{t('sources.documentsInRagHint')}</p>
                              </div>
                              {previewSourceForActions && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void refreshSourceDocuments(previewSourceForActions)}
                                  disabled={documentsLoading}
                                >
                                  {documentsLoading ? (
                                    <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="me-2 h-3.5 w-3.5" />
                                  )}
                                  {t('common.refresh')}
                                </Button>
                              )}
                            </div>

                            {documentsError && (
                              <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{documentsError}</span>
                              </div>
                            )}

                            {documentsLoading ? (
                              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                {t('sources.loadingDocuments')}
                              </div>
                            ) : sourceDocuments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noDocumentManifest')}</p>
                            ) : (
                              <div className="space-y-2">
                                {sourceDocuments.map((document) => {
                                  const isDeleting = deletingDocumentId === document.id;
                                  const deleteDisabled =
                                    isDeleting ||
                                    sourceDocuments.length <= 1 ||
                                    !onDeleteSourceDocument ||
                                    Boolean(previewSourceForActions && previewSourceForActions.status !== 'ready');
                                  return (
                                    <div
                                      key={document.id}
                                      className="flex items-start justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-xs"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate font-medium text-foreground">
                                          {document.title || document.filename || document.id}
                                        </p>
                                        <p className="mt-0.5 truncate text-muted-foreground">
                                          {document.filename || 'PDF'} {document.uploadedAt ? `• ${document.uploadedAt}` : ''}
                                        </p>
                                        {document.contentHash && (
                                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                            {document.contentHash.slice(0, 16)}
                                          </p>
                                        )}
                                      </div>
                                      {onDeleteSourceDocument && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon-sm"
                                          className="h-7 w-7 flex-shrink-0 text-destructive hover:text-destructive"
                                          disabled={deleteDisabled}
                                          title={
                                            sourceDocuments.length <= 1
                                              ? t('sources.deleteLastDocumentHint')
                                              : t('sources.deleteDocumentRebuild')
                                          }
                                          onClick={() => void handleDeleteDocument(document)}
                                        >
                                          {isDeleting ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                          )}
                                          <span className="sr-only">{t('sources.deleteDocument')}</span>
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="outline" className="space-y-3">
                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('sources.sectionTree')}
                            </p>
                            {sectionTree.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noSectionTree')}</p>
                            ) : (
                              <div className="space-y-1">
                                {sectionTree.slice(0, 220).map((node, index) => {
                                  const depth = Math.max(1, getNumber(node.depth, 1));
                                  return (
                                    <div
                                      key={`${index}-${String(node.title ?? '')}`}
                                      className="text-xs text-foreground"
                                      style={{ paddingInlineStart: `${(depth - 1) * 14}px` }}
                                    >
                                      {String(node.title ?? t('sources.untitled'))}{' '}
                                      <span className="text-muted-foreground">(p.{getNumber(node.page)})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="chunks" className="space-y-3">
                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('sources.firstChunks')}
                            </p>
                            {chunkPreview.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noChunkPreview')}</p>
                            ) : (
                              <div className="space-y-2">
                                {chunkPreview.slice(0, 20).map((chunk, index) => (
                                  <div key={`${index}-${String(chunk.chunk_id ?? '')}`} className="rounded bg-muted/40 px-2 py-2 text-xs">
                                    <p className="font-medium text-foreground">
                                      {String(chunk.section_title ?? t('common.general'))} • p.
                                      {getNumber(chunk.page_start)}-{getNumber(chunk.page_end)}
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                      {String(chunk.text ?? '').slice(0, 540)}
                                      {String(chunk.text ?? '').length > 540 ? '...' : ''}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="tables" className="space-y-3">
                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <Table className="h-3.5 w-3.5" />
                              {t('sources.tableExtractionExamples')}
                            </p>
                            {tableExamples.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noTableExamples')}</p>
                            ) : (
                              <div className="space-y-2">
                                {tableExamples.slice(0, 12).map((tableItem, index) => (
                                  <div key={`${index}-${String(tableItem.block_id ?? '')}`} className="rounded bg-muted/40 px-2 py-2 text-xs">
                                    <p className="font-medium text-foreground">
                                      block {String(tableItem.block_id ?? '')} • p.{getNumber(tableItem.page)}
                                    </p>
                                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-muted-foreground">
                                      {String(tableItem.text ?? '')}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="quality" className="space-y-3">
                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <FileWarning className="h-3.5 w-3.5" />
                              {t('sources.suspiciousChunks')}
                            </p>
                            {suspiciousChunks.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noSuspiciousChunks')}</p>
                            ) : (
                              <div className="space-y-2">
                                {suspiciousChunks.slice(0, 30).map((chunk, index) => (
                                  <div key={`${index}-${String(chunk.chunk_id ?? '')}`} className="rounded bg-muted/40 px-2 py-2 text-xs">
                                    <p className="font-medium text-foreground">
                                      {String(chunk.chunk_id ?? '')} • tokens={getNumber(chunk.token_estimate)}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {getStringArray(chunk.issues).join(', ') || t('sources.noIssues')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="rounded-md border border-border p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('sources.ocrExtractionIssues')}
                            </p>
                            {extractionIssues.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('sources.noExtractionIssues')}</p>
                            ) : (
                              <div className="space-y-1">
                                {extractionIssues.map((issue, index) => (
                                  <p key={`${index}-${String(issue.page_number ?? '')}`} className="text-xs text-foreground">
                                    p.{getNumber(issue.page_number)} • {String(issue.issue ?? 'issue')}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => (open ? setDeleteDialogOpen(true) : closeDeleteDialog())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              {t('sources.deleteSourceTitle')}
            </DialogTitle>
            <DialogDescription>{t('sources.deleteSourceDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {sourcePendingDelete && (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <p className="font-medium text-foreground">{sourcePendingDelete.title}</p>
                <p className="text-xs text-muted-foreground">
                  {scopeTypeLabel(sourcePendingDelete.scopeType, t)} -{' '}
                  {sourcePendingDelete.scopeValue || t('common.unspecified')}
                </p>
              </div>
            )}
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <p>- {t('sources.deleteSourceNote1')}</p>
              <p>- {t('sources.deleteSourceNote2')}</p>
              <p>- {t('sources.deleteSourceNote3')}</p>
              <p>- {t('sources.deleteSourceNote4')}</p>
            </div>
            {deleteError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={Boolean(deletingSourceId)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteSource()}
              disabled={!sourcePendingDelete || Boolean(deletingSourceId)}
            >
              {deletingSourceId ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('sources.deleteSource')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
