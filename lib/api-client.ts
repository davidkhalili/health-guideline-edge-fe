import type {
  AuthConfigData,
  AuthSession,
  AuthStatusData,
  AuthUser,
  ChatSessionDetail,
  ChatSessionSummary,
  ChatMessage,
  ChatResponseData,
  Citation,
  DeleteSourceData,
  LlmOptionsData,
  KnowledgeSource,
  BuildProgress,
  BuildProgressState,
  SafetyFlags,
  SourceBuildStatusData,
  SourceDocument,
  SourceDocumentsData,
  SourceIngestionPreviewData,
  SourceRebuildSettings,
  ServiceStatus,
  SourceListData,
  SourceScope,
  TranscribeResponseData,
} from '@/lib/types';

const DEFAULT_API_BASE_URL = 'https://health.twift.finance';

function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_RAG_API_BASE_URL?.trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl()}${normalizedPath}`;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
  });
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function normalizeScope(value: string): SourceScope {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'country' || normalized === 'global' || normalized === 'regional') {
    return normalized;
  }
  return 'custom';
}

function normalizeStatus(value: string): KnowledgeSource['status'] {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'ready' || normalized === 'failed' || normalized === 'pending') {
    return normalized;
  }
  return 'pending';
}

function normalizeServiceStatus(value: string): ServiceStatus {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'online' ||
    normalized === 'warming' ||
    normalized === 'offline' ||
    normalized === 'degraded' ||
    normalized === 'retrying'
  ) {
    return normalized;
  }
  return 'offline';
}

function mapSafety(raw: unknown): SafetyFlags {
  const candidate = (raw as Record<string, unknown>) || {};
  return {
    dosageFiltered: Boolean(candidate.dosage_filtered ?? candidate.dosageFiltered),
    languageFiltered: Boolean(candidate.language_filtered ?? candidate.languageFiltered),
    structuralReferenceFiltered: Boolean(
      candidate.structural_reference_filtered ?? candidate.structuralReferenceFiltered
    ),
  };
}

function mapSource(raw: unknown): KnowledgeSource {
  const candidate = (raw as Record<string, unknown>) || {};
  return {
    id: String(candidate.id ?? '').trim(),
    title: String(candidate.title ?? '').trim(),
    scopeType: normalizeScope(String(candidate.scope_type ?? candidate.scopeType ?? 'custom')),
    scopeValue: String(candidate.scope_value ?? candidate.scopeValue ?? '').trim(),
    origin: String(candidate.origin ?? 'user').trim() || 'user',
    status: normalizeStatus(String(candidate.status ?? 'pending')),
    ready: Boolean(candidate.ready),
    documentCount: Number(candidate.document_count ?? candidate.documentCount ?? 1) || 1,
    embeddingModel: String(candidate.embedding_model ?? candidate.embeddingModel ?? '').trim(),
    chunkCount: Number(candidate.chunk_count ?? candidate.chunkCount ?? 0) || undefined,
    sourcePdf: String(candidate.source_pdf ?? candidate.sourcePdf ?? '').trim(),
    dataDir: String(candidate.data_dir ?? candidate.dataDir ?? '').trim(),
    createdAt: String(candidate.created_at ?? candidate.createdAt ?? '').trim(),
    lastUpdated: String(candidate.last_updated ?? candidate.lastUpdated ?? '').trim(),
  };
}

function mapSourceDocument(raw: unknown): SourceDocument {
  const candidate = (raw as Record<string, unknown>) || {};
  return {
    id: String(candidate.id ?? '').trim(),
    title: String(candidate.title ?? '').trim(),
    filename: String(candidate.filename ?? '').trim(),
    uploadedAt: String(candidate.uploaded_at ?? candidate.uploadedAt ?? '').trim(),
    contentHash: String(candidate.content_hash ?? candidate.contentHash ?? '').trim(),
    sourcePdf: String(candidate.source_pdf ?? candidate.sourcePdf ?? '').trim(),
  };
}

function mapCitation(raw: unknown, index: number): Citation {
  const candidate = (raw as Record<string, unknown>) || {};
  const sourceId = String(candidate.document_id ?? candidate.source_id ?? candidate.sourceId ?? '').trim();
  const sectionId = String(candidate.section_id ?? candidate.sectionId ?? '?').trim() || '?';
  const sectionPath = Array.isArray(candidate.section_path)
    ? candidate.section_path.map((value) => String(value).trim()).filter(Boolean)
    : Array.isArray(candidate.sectionPath)
      ? candidate.sectionPath.map((value) => String(value).trim()).filter(Boolean)
      : undefined;
  const sectionPathLabel = String(candidate.section_path_label ?? candidate.sectionPathLabel ?? '').trim();
  return {
    id: String(candidate.id ?? `${sourceId}:${sectionId}:${index + 1}`).trim(),
    sourceId,
    sourceTitle: String(candidate.document_title ?? candidate.source_title ?? candidate.sourceTitle ?? '').trim(),
    sectionId,
    sectionTitle: String(candidate.section_title ?? candidate.sectionTitle ?? '').trim(),
    sectionPath,
    sectionPathLabel,
    chunkText: String(candidate.source_text ?? candidate.chunkText ?? '').trim(),
    chunkPreview: String(candidate.source_preview ?? candidate.chunkPreview ?? '').trim(),
    highlightedSpans: Array.isArray(candidate.highlighted_spans)
      ? candidate.highlighted_spans
          .map((span) => ({
            start: Number((span as Record<string, unknown>).start ?? 0),
            end: Number((span as Record<string, unknown>).end ?? 0),
          }))
          .filter((span) => span.end > span.start)
      : [],
    relevanceScore:
      typeof candidate.score === 'number'
        ? candidate.score
        : typeof candidate.relevanceScore === 'number'
          ? candidate.relevanceScore
          : undefined,
  };
}

function mapAuthUser(raw: unknown): AuthUser {
  const candidate = (raw as Record<string, unknown>) || {};
  return {
    userId: String(candidate.user_id ?? candidate.userId ?? '').trim(),
    email: String(candidate.email ?? '').trim(),
    role: String(candidate.role ?? 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user',
    provider: String(candidate.provider ?? 'local').trim().toLowerCase() || 'local',
    avatarUrl: String(candidate.avatar_url ?? candidate.avatarUrl ?? '').trim(),
  };
}

function mapChatResponse(raw: unknown): ChatResponseData {
  const candidate = (raw as Record<string, unknown>) || {};
  const citationsRaw = Array.isArray(candidate.citations) ? candidate.citations : [];
  return {
    answer: String(candidate.answer ?? '').trim(),
    citations: citationsRaw.map((citation, index) => mapCitation(citation, index)),
    llmOptionId: String(candidate.llm_option_id ?? candidate.llmOptionId ?? '').trim(),
    llmLabel: String(candidate.llm_label ?? candidate.llmLabel ?? '').trim(),
    llmProvider: String(candidate.llm_provider ?? candidate.llmProvider ?? '').trim(),
    llmModel: String(candidate.llm_model ?? candidate.llmModel ?? '').trim(),
    sessionId: String(candidate.session_id ?? candidate.sessionId ?? '').trim(),
    turnId: String(candidate.turn_id ?? candidate.turnId ?? '').trim(),
    selectedSourceIds: Array.isArray(candidate.selected_source_ids)
      ? candidate.selected_source_ids.map((value) => String(value).trim()).filter(Boolean)
      : [],
    selectedSourceTitles: Array.isArray(candidate.selected_source_titles)
      ? candidate.selected_source_titles.map((value) => String(value).trim()).filter(Boolean)
      : [],
    warnings: Array.isArray(candidate.warnings)
      ? candidate.warnings.map((value) => String(value).trim()).filter(Boolean)
      : [],
    retrievalQueryUsed: String(
      candidate.retrieval_query_used ?? candidate.retrievalQueryUsed ?? ''
    ).trim(),
    followupPlan: (candidate.followup_plan ?? candidate.followupPlan ?? {}) as Record<string, unknown>,
    safety: mapSafety(candidate.safety),
  };
}

function mapTranscribeResponse(raw: unknown): TranscribeResponseData {
  const candidate = (raw as Record<string, unknown>) || {};
  return {
    text: String(candidate.text ?? '').trim(),
    language: String(candidate.language ?? '').trim(),
    durationSec: Number(candidate.duration_sec ?? candidate.durationSec ?? 0) || 0,
    warnings: Array.isArray(candidate.warnings)
      ? candidate.warnings.map((value) => String(value).trim()).filter(Boolean)
      : [],
  };
}

function mapHistoryForApi(history: ChatMessage[]) {
  return history.map((message) => ({
    role: message.role,
    content: message.content,
    source_switch: Boolean(message.sourceSwitch),
  }));
}

function mapChatSessionSummary(raw: unknown): ChatSessionSummary {
  const candidate = (raw as Record<string, unknown>) || {};
  return {
    sessionId: String(candidate.session_id ?? candidate.sessionId ?? '').trim(),
    title: String(candidate.title ?? '').trim() || 'Untitled session',
    createdAt: String(candidate.created_at ?? candidate.createdAt ?? '').trim(),
    updatedAt: String(candidate.updated_at ?? candidate.updatedAt ?? '').trim(),
    completedAt: String(candidate.completed_at ?? candidate.completedAt ?? '').trim(),
    turnCount: Number(candidate.turn_count ?? candidate.turnCount ?? 0) || 0,
    lastQuestion: String(candidate.last_question ?? candidate.lastQuestion ?? '').trim(),
    selectedSourceIds: Array.isArray(candidate.selected_source_ids)
      ? candidate.selected_source_ids.map((value) => String(value).trim()).filter(Boolean)
      : [],
    selectedSourceTitles: Array.isArray(candidate.selected_source_titles)
      ? candidate.selected_source_titles.map((value) => String(value).trim()).filter(Boolean)
      : [],
  };
}

function mapChatSessionTurn(raw: unknown, index: number) {
  const candidate = (raw as Record<string, unknown>) || {};
  const citationsRaw = Array.isArray(candidate.citations) ? candidate.citations : [];
  const feedbackRaw =
    typeof candidate.feedback === 'object' && candidate.feedback !== null
      ? (candidate.feedback as Record<string, unknown>)
      : undefined;
  return {
    turnId: String(candidate.turn_id ?? candidate.turnId ?? '').trim(),
    timestamp: String(candidate.timestamp ?? '').trim(),
    question: String(candidate.question ?? '').trim(),
    answer: String(candidate.answer ?? '').trim(),
    citations: citationsRaw.map((citation, citationIdx) =>
      mapCitation(citation, index * 100 + citationIdx)
    ),
    safety: typeof candidate.safety === 'object' && candidate.safety !== null
      ? (candidate.safety as Record<string, unknown>)
      : {},
    warnings: Array.isArray(candidate.warnings)
      ? candidate.warnings.map((value) => String(value).trim()).filter(Boolean)
      : [],
    selectedSourceIds: Array.isArray(candidate.selected_source_ids)
      ? candidate.selected_source_ids.map((value) => String(value).trim()).filter(Boolean)
      : [],
    selectedSourceTitles: Array.isArray(candidate.selected_source_titles)
      ? candidate.selected_source_titles.map((value) => String(value).trim()).filter(Boolean)
      : [],
    retrievalQueryUsed: String(
      candidate.retrieval_query_used ?? candidate.retrievalQueryUsed ?? ''
    ).trim(),
    followupPlan: typeof candidate.followup_plan === 'object' && candidate.followup_plan !== null
      ? (candidate.followup_plan as Record<string, unknown>)
      : {},
    patientContext: String(candidate.patient_context ?? candidate.patientContext ?? '').trim(),
    feedback: feedbackRaw
      ? {
          rating: Number(feedbackRaw.rating ?? 0),
          notes: String(feedbackRaw.notes ?? '').trim(),
          submittedAt: String(feedbackRaw.submitted_at ?? feedbackRaw.submittedAt ?? '').trim(),
        }
      : undefined,
  };
}

function mapChatSessionDetail(raw: unknown): ChatSessionDetail {
  const candidate = (raw as Record<string, unknown>) || {};
  const turnsRaw = Array.isArray(candidate.turns) ? candidate.turns : [];
  return {
    sessionId: String(candidate.session_id ?? candidate.sessionId ?? '').trim(),
    createdAt: String(candidate.created_at ?? candidate.createdAt ?? '').trim(),
    updatedAt: String(candidate.updated_at ?? candidate.updatedAt ?? '').trim(),
    completedAt: String(candidate.completed_at ?? candidate.completedAt ?? '').trim(),
    survey:
      typeof candidate.survey === 'object' && candidate.survey !== null
        ? (candidate.survey as Record<string, unknown>)
        : {},
    featureVotes: Array.isArray(candidate.feature_votes)
      ? candidate.feature_votes.map((value) => String(value).trim()).filter(Boolean)
      : [],
    selectedSourceIds: Array.isArray(candidate.selected_source_ids)
      ? candidate.selected_source_ids.map((value) => String(value).trim()).filter(Boolean)
      : [],
    selectedSourceTitles: Array.isArray(candidate.selected_source_titles)
      ? candidate.selected_source_titles.map((value) => String(value).trim()).filter(Boolean)
      : [],
    patientContext: String(candidate.patient_context ?? candidate.patientContext ?? '').trim(),
    turns: turnsRaw.map((turn, index) => mapChatSessionTurn(turn, index)),
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text.trim()) {
    return `Request failed with status ${response.status}`;
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return String(parsed.detail ?? parsed.message ?? text);
  } catch {
    return text;
  }
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  const response = await apiFetch('/api/status', { cache: 'no-store' });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return normalizeServiceStatus(String(payload.status ?? 'offline'));
}

export async function getAuthConfig(): Promise<AuthConfigData> {
  const response = await apiFetch('/api/auth/config', { cache: 'no-store' });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    googleEnabled: Boolean(payload.google_enabled ?? payload.googleEnabled),
  };
}

export async function getAuthStatus(): Promise<AuthStatusData> {
  const response = await apiFetch('/api/auth/me', { cache: 'no-store' });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const authenticated = Boolean(payload.authenticated);
  return {
    authenticated,
    user:
      authenticated && payload.user
        ? mapAuthUser(payload.user)
        : undefined,
  };
}

export interface PasswordAuthInput {
  email: string;
  password: string;
}

export async function registerWithPassword(input: PasswordAuthInput): Promise<AuthSession> {
  const response = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    user: mapAuthUser(payload.user),
  };
}

export async function loginWithPassword(input: PasswordAuthInput): Promise<AuthSession> {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    user: mapAuthUser(payload.user),
  };
}

export async function loginWithGoogle(idToken: string): Promise<AuthSession> {
  const response = await apiFetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    user: mapAuthUser(payload.user),
  };
}

export async function logoutSession(): Promise<void> {
  const response = await apiFetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
}

export async function getSources(): Promise<SourceListData> {
  const response = await apiFetch('/api/sources', { cache: 'no-store' });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const sources = Array.isArray(payload.sources) ? payload.sources.map(mapSource) : [];
  return {
    sources,
    defaultSourceId: String(payload.default_source_id ?? payload.defaultSourceId ?? '').trim(),
    maxSelectedSources: Number(payload.max_selected_sources ?? payload.maxSelectedSources ?? 3) || 3,
    selectionNote: String(payload.selection_note ?? payload.selectionNote ?? '').trim(),
  };
}

function normalizeBuildState(value: unknown): BuildProgressState {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'running' || normalized === 'done' || normalized === 'error') {
    return normalized;
  }
  return 'idle';
}

function mapBuildProgress(raw: unknown): BuildProgress {
  const candidate = (raw as Record<string, unknown>) || {};
  return {
    state: normalizeBuildState(candidate.state),
    stage: String(candidate.stage ?? '').trim(),
    percent: Math.max(0, Math.min(100, Number(candidate.percent ?? 0) || 0)),
    message: String(candidate.message ?? '').trim(),
    error: String(candidate.error ?? '').trim(),
    updatedAt: String(candidate.updated_at ?? candidate.updatedAt ?? '').trim(),
  };
}

export async function getSourceBuildStatus(sourceId: string): Promise<SourceBuildStatusData> {
  const response = await apiFetch(`/api/sources/${encodeURIComponent(sourceId)}/build-status`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    source: mapSource(payload.source),
    missingFiles: Array.isArray(payload.missing_files)
      ? payload.missing_files.map((value) => String(value).trim()).filter(Boolean)
      : [],
    building: Boolean(payload.building),
    progress: mapBuildProgress(payload.progress),
  };
}

export async function getSourceIngestionPreview(
  sourceId: string
): Promise<SourceIngestionPreviewData> {
  const response = await apiFetch(`/api/sources/${encodeURIComponent(sourceId)}/ingestion-preview`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    source: mapSource(payload.source),
    available: Boolean(payload.available),
    docId: String(payload.doc_id ?? payload.docId ?? '').trim(),
    ingestionReport:
      typeof payload.ingestion_report === 'object' && payload.ingestion_report !== null
        ? (payload.ingestion_report as Record<string, unknown>)
        : {},
    adminPreview:
      typeof payload.admin_preview === 'object' && payload.admin_preview !== null
        ? (payload.admin_preview as Record<string, unknown>)
        : {},
    previewMarkdown: String(payload.preview_markdown ?? payload.previewMarkdown ?? '').trim(),
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.map((value) => String(value).trim()).filter(Boolean)
      : [],
  };
}

export async function getSourceDocuments(sourceId: string): Promise<SourceDocumentsData> {
  const response = await apiFetch(`/api/sources/${encodeURIComponent(sourceId)}/documents`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    source: mapSource(payload.source),
    documents: Array.isArray(payload.documents)
      ? payload.documents.map(mapSourceDocument)
      : [],
  };
}

export async function rebuildSourceWithSettings(
  sourceId: string,
  settings: SourceRebuildSettings
): Promise<KnowledgeSource> {
  const response = await apiFetch(`/api/sources/${encodeURIComponent(sourceId)}/rebuild`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parser_mode: settings.parserMode,
      enable_docling: settings.enableDocling,
      enable_ocr: settings.enableOcr,
      include_appendices: settings.includeAppendices,
      output_markdown: settings.outputMarkdown,
      embedding_model: settings.embeddingModel,
      max_retrieval_chunk_tokens: settings.maxRetrievalChunkTokens,
      max_parent_chunk_tokens: settings.maxParentChunkTokens,
      chunk_overlap_tokens: settings.chunkOverlapTokens,
      admin_preview_chunk_count: settings.adminPreviewChunkCount,
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return mapSource(payload.source);
}

export async function getLlmOptions(): Promise<LlmOptionsData> {
  const response = await apiFetch('/api/llm/options', { cache: 'no-store' });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const optionsRaw = Array.isArray(payload.options) ? payload.options : [];
  return {
    options: optionsRaw.map((option) => {
      const candidate = (option as Record<string, unknown>) || {};
      return {
        id: String(candidate.id ?? '').trim(),
        label: String(candidate.label ?? '').trim(),
        provider: String(candidate.provider ?? '').trim(),
        model: String(candidate.model ?? '').trim(),
        isDefault: Boolean(candidate.is_default ?? candidate.isDefault),
      };
    }),
    defaultOptionId: String(payload.default_option_id ?? payload.defaultOptionId ?? '').trim(),
    selectedOptionId: String(payload.selected_option_id ?? payload.selectedOptionId ?? '').trim(),
    canSelect: Boolean(payload.can_select ?? payload.canSelect),
    enforcedProvider: String(payload.enforced_provider ?? payload.enforcedProvider ?? '').trim(),
    enforcedModel: String(payload.enforced_model ?? payload.enforcedModel ?? '').trim(),
  };
}

export interface UploadSourceInput {
  title: string;
  scopeType: SourceScope;
  scopeValue: string;
  file?: File;
  files?: File[];
  build?: boolean;
}

export interface AddSourceDocumentInput {
  sourceId: string;
  title?: string;
  file: File;
  build?: boolean;
}

export async function uploadSource(input: UploadSourceInput): Promise<KnowledgeSource> {
  const formData = new FormData();
  const files = input.files && input.files.length > 0 ? input.files : input.file ? [input.file] : [];
  if (files[0]) {
    formData.append('file', files[0]);
  }
  for (const file of files.slice(1)) {
    formData.append('files', file);
  }
  formData.append('title', input.title);
  formData.append('scope_type', input.scopeType);
  formData.append('scope_value', input.scopeValue);
  formData.append('build', input.build === false ? 'false' : 'true');

  const response = await apiFetch('/api/sources/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return mapSource(payload.source);
}

export async function addSourceDocument(input: AddSourceDocumentInput): Promise<KnowledgeSource> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('title', input.title?.trim() || input.file.name.replace(/\.pdf$/i, ''));
  formData.append('build', input.build === false ? 'false' : 'true');

  const response = await apiFetch(`/api/sources/${encodeURIComponent(input.sourceId)}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return mapSource(payload.source);
}

export interface DeleteSourceDocumentData {
  source: KnowledgeSource;
  documentId: string;
  deleted: boolean;
  building: boolean;
  removedPaths: string[];
  warnings: string[];
}

export async function deleteSourceDocument(
  sourceId: string,
  documentId: string
): Promise<DeleteSourceDocumentData> {
  const response = await apiFetch(
    `/api/sources/${encodeURIComponent(sourceId)}/documents/${encodeURIComponent(documentId)}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    source: mapSource(payload.source),
    documentId: String(payload.document_id ?? payload.documentId ?? '').trim(),
    deleted: Boolean(payload.deleted),
    building: Boolean(payload.building),
    removedPaths: Array.isArray(payload.removed_paths)
      ? payload.removed_paths.map((value) => String(value).trim()).filter(Boolean)
      : [],
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.map((value) => String(value).trim()).filter(Boolean)
      : [],
  };
}

export async function deleteSource(sourceId: string): Promise<DeleteSourceData> {
  const response = await apiFetch(`/api/sources/${encodeURIComponent(sourceId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    sourceId: String(payload.source_id ?? payload.sourceId ?? '').trim(),
    deleted: Boolean(payload.deleted),
    removedPaths: Array.isArray(payload.removed_paths)
      ? payload.removed_paths.map((value) => String(value).trim()).filter(Boolean)
      : [],
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.map((value) => String(value).trim()).filter(Boolean)
      : [],
  };
}

export interface ChatRequestInput {
  question: string;
  history: ChatMessage[];
  selectedSourceIds: string[];
  llmOptionId?: string;
  sessionId?: string;
  patientContextEnabled?: boolean;
  patientContext?: string;
}

export async function sendChat(input: ChatRequestInput): Promise<ChatResponseData> {
  const response = await apiFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: input.question,
      history: mapHistoryForApi(input.history),
      selected_source_ids: input.selectedSourceIds,
      llm_option_id: input.llmOptionId ?? '',
      session_id: input.sessionId ?? '',
      patient_context_enabled: Boolean(input.patientContextEnabled),
      patient_context: input.patientContext ?? '',
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = await response.json();
  return mapChatResponse(payload);
}

export interface TranscribeAudioInput {
  file: File;
  signal?: AbortSignal;
}

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeResponseData> {
  const formData = new FormData();
  formData.append('audio', input.file, input.file.name || 'recording.webm');
  const response = await apiFetch('/api/transcribe', {
    method: 'POST',
    body: formData,
    signal: input.signal,
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = await response.json();
  return mapTranscribeResponse(payload);
}

type StreamEventName = 'token' | 'replace' | 'done' | 'error';

interface StreamEventPayload {
  event: StreamEventName;
  data: Record<string, unknown>;
}

function parseSseEvent(rawEvent: string): StreamEventPayload | null {
  const lines = rawEvent.split('\n');
  let eventName: StreamEventName = 'token';
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) {
      continue;
    }
    if (line.startsWith('event:')) {
      const candidate = line.slice(6).trim();
      if (candidate === 'token' || candidate === 'replace' || candidate === 'done' || candidate === 'error') {
        eventName = candidate;
      }
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const serialized = dataLines.join('\n');
  try {
    return {
      event: eventName,
      data: JSON.parse(serialized) as Record<string, unknown>,
    };
  } catch {
    return {
      event: eventName,
      data: { message: serialized },
    };
  }
}

export interface ChatStreamHandlers {
  onToken: (text: string) => void;
  onReplace?: (content: string, safety: SafetyFlags) => void;
  onDone: (response: ChatResponseData) => void;
  onError?: (message: string) => void;
}

export async function streamChat(input: ChatRequestInput, handlers: ChatStreamHandlers): Promise<void> {
  const response = await apiFetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: input.question,
      history: mapHistoryForApi(input.history),
      selected_source_ids: input.selectedSourceIds,
      llm_option_id: input.llmOptionId ?? '',
      session_id: input.sessionId ?? '',
      patient_context_enabled: Boolean(input.patientContextEnabled),
      patient_context: input.patientContext ?? '',
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  if (!response.body) {
    throw new ApiError('Streaming response body is empty.', 500);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneReceived = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const parsed = parseSseEvent(rawEvent);
      if (!parsed) {
        separatorIndex = buffer.indexOf('\n\n');
        continue;
      }
      if (parsed.event === 'token') {
        handlers.onToken(String(parsed.data.text ?? ''));
      } else if (parsed.event === 'replace') {
        handlers.onReplace?.(
          String(parsed.data.content ?? ''),
          mapSafety(parsed.data.safety)
        );
      } else if (parsed.event === 'error') {
        handlers.onError?.(String(parsed.data.message ?? 'Unknown streaming error'));
      } else if (parsed.event === 'done') {
        handlers.onDone(mapChatResponse(parsed.data));
        doneReceived = true;
      }
      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  if (!doneReceived) {
    throw new ApiError('Chat stream ended without a completion event.', 500);
  }
}

export interface ChatFeedbackInput {
  sessionId: string;
  turnId: string;
  rating: number;
  notes?: string;
}

export interface ChatFeedbackData {
  sessionId: string;
  turnId: string;
  feedback: {
    rating: number;
    notes: string;
    submittedAt: string;
  };
}

export async function submitChatFeedback(input: ChatFeedbackInput): Promise<ChatFeedbackData> {
  const response = await apiFetch('/api/chat/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: input.sessionId,
      turn_id: input.turnId,
      rating: input.rating,
      notes: input.notes ?? '',
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const feedbackRaw =
    typeof payload.feedback === 'object' && payload.feedback !== null
      ? (payload.feedback as Record<string, unknown>)
      : {};
  return {
    sessionId: String(payload.session_id ?? payload.sessionId ?? '').trim(),
    turnId: String(payload.turn_id ?? payload.turnId ?? '').trim(),
    feedback: {
      rating: Number(feedbackRaw.rating ?? 0),
      notes: String(feedbackRaw.notes ?? '').trim(),
      submittedAt: String(feedbackRaw.submitted_at ?? feedbackRaw.submittedAt ?? '').trim(),
    },
  };
}

export interface SessionFinalizeInput {
  sessionId: string;
  survey?: Record<string, unknown>;
  featureVotes?: string[];
}

export interface SessionFinalizeData {
  sessionId: string;
  completedAt: string;
  featureVotes: string[];
  survey: Record<string, unknown>;
}

export async function finalizeChatSession(input: SessionFinalizeInput): Promise<SessionFinalizeData> {
  const response = await apiFetch('/api/chat/session/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: input.sessionId,
      survey: input.survey ?? {},
      feature_votes: input.featureVotes ?? [],
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const featureVotes = Array.isArray(payload.feature_votes)
    ? payload.feature_votes.map((value) => String(value).trim()).filter(Boolean)
    : [];
  return {
    sessionId: String(payload.session_id ?? payload.sessionId ?? '').trim(),
    completedAt: String(payload.completed_at ?? payload.completedAt ?? '').trim(),
    featureVotes,
    survey:
      typeof payload.survey === 'object' && payload.survey !== null
        ? (payload.survey as Record<string, unknown>)
        : {},
  };
}

export async function resolveCitationHighlight(
  question: string,
  citation: Citation
): Promise<Citation> {
  const response = await apiFetch('/api/citations/highlight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      citation: {
        id: citation.id,
        document_id: citation.sourceId,
        document_title: citation.sourceTitle,
        section_id: citation.sectionId,
        section_title: citation.sectionTitle,
        section_path: citation.sectionPath,
        section_path_label: citation.sectionPathLabel,
        source_text: citation.chunkText,
        source_preview: citation.chunkPreview,
        highlighted_spans: citation.highlightedSpans,
      },
    }),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return mapCitation(payload.citation, 0);
}

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  const response = await apiFetch('/api/chat/sessions', { cache: 'no-store' });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const sessionsRaw = Array.isArray(payload.sessions) ? payload.sessions : [];
  return sessionsRaw.map((session) => mapChatSessionSummary(session));
}

export async function getChatSessionDetail(sessionId: string): Promise<ChatSessionDetail> {
  const response = await apiFetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  return mapChatSessionDetail(payload);
}
