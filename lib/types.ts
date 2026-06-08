export type SourceScope = 'country' | 'global' | 'regional' | 'custom';
export type SourceStatus = 'ready' | 'pending' | 'failed';
export type ServiceStatus = 'online' | 'warming' | 'offline' | 'degraded' | 'retrying';
export type UserRole = 'user' | 'admin';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  provider: 'local' | 'google' | string;
  avatarUrl: string;
}

export interface AuthSession {
  user: AuthUser;
}

export interface AuthStatusData {
  authenticated: boolean;
  user?: AuthUser;
}

export interface AuthConfigData {
  googleEnabled: boolean;
}

export interface LlmOption {
  id: string;
  label: string;
  provider: string;
  model: string;
  isDefault: boolean;
}

export interface LlmOptionsData {
  options: LlmOption[];
  defaultOptionId: string;
  selectedOptionId: string;
  canSelect: boolean;
  enforcedProvider: string;
  enforcedModel: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  scopeType: SourceScope;
  scopeValue: string;
  origin: string;
  status: SourceStatus;
  ready: boolean;
  documentCount: number;
  embeddingModel?: string;
  chunkCount?: number;
  sourcePdf?: string;
  dataDir?: string;
  createdAt?: string;
  lastUpdated?: string;
}

export type BuildProgressState = 'idle' | 'running' | 'done' | 'error';

export interface BuildProgress {
  state: BuildProgressState;
  stage: string;
  percent: number;
  message: string;
  error: string;
  updatedAt: string;
}

export interface SourceBuildStatusData {
  source: KnowledgeSource;
  missingFiles: string[];
  building: boolean;
  progress: BuildProgress;
}

export interface SourceDocument {
  id: string;
  title: string;
  filename: string;
  uploadedAt: string;
  contentHash: string;
  sourcePdf: string;
}

export interface SourceDocumentsData {
  source: KnowledgeSource;
  documents: SourceDocument[];
}

export interface Citation {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sectionId: string;
  sectionTitle: string;
  sectionPath?: string[];
  sectionPathLabel?: string;
  chunkText: string;
  chunkPreview?: string;
  highlightedSpans: Array<{ start: number; end: number }>;
  relevanceScore?: number;
}

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface MessageFeedback {
  rating: FeedbackRating;
  notes: string;
  submittedAt: string;
}

export interface PatientContext {
  enabled: boolean;
  ageYears: string;
  biologicalSex: string;
  pregnancyStatus: string;
  weightKg: string;
  keyConditions: string;
  currentMedications: string;
  additionalNotes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  patientContextEnabled?: boolean;
  question?: string;
  sessionId?: string;
  turnId?: string;
  citations?: Citation[];
  timestamp: string;
  isStreaming?: boolean;
  safetyFiltered?: boolean;
  safetyFilterReason?: string;
  sourceSwitch?: boolean;
  feedback?: MessageFeedback;
  feedbackSaving?: boolean;
  feedbackError?: string;
}

export interface ActiveSourceSet {
  countrySource?: KnowledgeSource;
  globalSources: KnowledgeSource[];
}

export interface SourceListData {
  sources: KnowledgeSource[];
  defaultSourceId: string;
  maxSelectedSources: number;
  selectionNote: string;
}

export interface DeleteSourceData {
  sourceId: string;
  deleted: boolean;
  removedPaths: string[];
  warnings: string[];
}

export interface SourceIngestionPreviewData {
  source: KnowledgeSource;
  available: boolean;
  docId: string;
  ingestionReport: Record<string, unknown>;
  adminPreview: Record<string, unknown>;
  previewMarkdown: string;
  warnings: string[];
}

export interface SourceRebuildSettings {
  parserMode: 'auto' | 'pymupdf' | 'docling' | 'legacy' | 'ocr';
  enableDocling: boolean;
  enableOcr: boolean;
  includeAppendices: boolean;
  outputMarkdown: boolean;
  embeddingModel: string;
  maxRetrievalChunkTokens: number;
  maxParentChunkTokens: number;
  chunkOverlapTokens: number;
  adminPreviewChunkCount: number;
}

export interface SafetyFlags {
  dosageFiltered: boolean;
  languageFiltered: boolean;
  structuralReferenceFiltered: boolean;
}

export interface ChatResponseData {
  answer: string;
  citations: Citation[];
  llmOptionId: string;
  llmLabel: string;
  llmProvider: string;
  llmModel: string;
  sessionId: string;
  turnId: string;
  selectedSourceIds: string[];
  selectedSourceTitles: string[];
  warnings: string[];
  retrievalQueryUsed: string;
  followupPlan: Record<string, unknown>;
  safety: SafetyFlags;
}

export interface TranscribeResponseData {
  text: string;
  language: string;
  durationSec: number;
  warnings: string[];
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  turnCount: number;
  lastQuestion: string;
  selectedSourceIds: string[];
  selectedSourceTitles: string[];
}

export interface ChatSessionTurn {
  turnId: string;
  timestamp: string;
  question: string;
  answer: string;
  citations: Citation[];
  safety: Record<string, unknown>;
  warnings: string[];
  selectedSourceIds: string[];
  selectedSourceTitles: string[];
  retrievalQueryUsed: string;
  followupPlan: Record<string, unknown>;
  patientContext: string;
  feedback?: {
    rating: number;
    notes: string;
    submittedAt: string;
  };
}

export interface ChatSessionDetail {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  survey: Record<string, unknown>;
  featureVotes: string[];
  selectedSourceIds: string[];
  selectedSourceTitles: string[];
  patientContext: string;
  turns: ChatSessionTurn[];
}
