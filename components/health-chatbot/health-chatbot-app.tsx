'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ActiveSourceSet,
  AuthUser,
  BuildProgress,
  ChatMessage,
  ChatSessionSummary,
  Citation,
  FeedbackRating,
  KnowledgeSource,
  LlmOption,
  PatientContext,
  SourceDocument,
  SourceRebuildSettings,
  SafetyFlags,
  ServiceStatus,
} from '@/lib/types';
import {
  ApiError,
  addSourceDocument,
  deleteSourceDocument,
  deleteSource,
  finalizeChatSession,
  getChatSessionDetail,
  getLlmOptions,
  getSourceBuildStatus,
  getSourceDocuments,
  getSourceIngestionPreview,
  getServiceStatus,
  getSources,
  listChatSessions,
  logoutSession,
  rebuildSourceWithSettings,
  resolveCitationHighlight,
  sendChat,
  streamChat,
  submitChatFeedback,
  transcribeAudio,
  uploadSource,
} from '@/lib/api-client';
import { buildActiveSourceSet, selectedSourceTitles, sourceIdsFromActiveSet } from '@/lib/source-utils';
import { isFeedbackEligibleMessage, latestFeedbackEligibleMessage } from '@/lib/message-feedback';
import { buildPatientContextText, emptyPatientContext } from '@/lib/patient-context';
import {
  buildGreeting,
  CHECKPOINT_TURN_TARGET,
  createMessageId,
  GUEST_QUESTION_LIMIT,
  getNextFeatureOptions,
  normalizeSourceSelection,
  nowIso,
  areIdListsEqual,
  BUILD_STATUS_POLL_INTERVAL_MS,
  safetyReason,
  SessionEndSummary,
  STATUS_POLL_INTERVAL_MS,
} from './chat-runtime';
import { useI18n } from '@/lib/i18n/context';
import { AppHeader } from './app-header';
import { ChatHistorySidebar } from './chat-history-sidebar';
import { ChatWorkspace } from './chat-workspace';
import { SourcesPage } from './sources-page';
import { DisclaimerBanner } from './disclaimer-banner';
import { ServiceStatusBanner } from './service-status';
import { SessionFlowDialogs } from './session-flow-dialogs';
import { useResizablePanel } from './hooks/use-resizable-panel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { LogIn, PanelLeftOpen, Plus } from 'lucide-react';

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface HealthChatbotAppProps {
  currentUser: AuthUser | null;
}

export function HealthChatbotApp({ currentUser }: HealthChatbotAppProps) {
  const { t, isRtl } = useI18n();
  const [currentView, setCurrentView] = useState<'chat' | 'sources'>('chat');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('warming');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [buildProgressById, setBuildProgressById] = useState<Record<string, BuildProgress>>({});
  const [defaultSourceId, setDefaultSourceId] = useState('');
  const [maxSelectedSources, setMaxSelectedSources] = useState(3);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [llmOptions, setLlmOptions] = useState<LlmOption[]>([]);
  const [selectedLlmOptionId, setSelectedLlmOptionId] = useState('');
  const [canSelectLlm, setCanSelectLlm] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<ChatSessionSummary[]>([]);
  const [isLoadingSessionHistory, setIsLoadingSessionHistory] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState('');
  const [chatSessionId, setChatSessionId] = useState('');
  const [patientContext, setPatientContext] = useState<PatientContext>(() => emptyPatientContext());
  const [persistedPatientContextText, setPersistedPatientContextText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingSources, setIsRefreshingSources] = useState(false);
  const [startupError, setStartupError] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [checkpointPromptShown, setCheckpointPromptShown] = useState(false);
  const [checkpointDialogOpen, setCheckpointDialogOpen] = useState(false);
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [isFinalizingSession, setIsFinalizingSession] = useState(false);
  const [surveyOverallRating, setSurveyOverallRating] = useState<FeedbackRating | null>(null);
  const [surveyWorkflowFit, setSurveyWorkflowFit] = useState<'yes' | 'no' | 'maybe' | ''>('');
  const [surveyNotes, setSurveyNotes] = useState('');
  const [selectedFeatureVotes, setSelectedFeatureVotes] = useState<string[]>([]);
  const [surveyEntryPoint, setSurveyEntryPoint] = useState<'manual' | 'checkpoint' | ''>('');
  const [surveySubmitError, setSurveySubmitError] = useState('');
  const [sessionEndSummary, setSessionEndSummary] = useState<SessionEndSummary | null>(null);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [guestInfoOpen, setGuestInfoOpen] = useState(false);
  const selectedSourceIdsRef = useRef<string[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const chatSessionIdRef = useRef<string>('');
  const isGuest = !currentUser;
  const isAdmin = currentUser?.role === 'admin';
  const {
    width: historySidebarWidth,
    handleResizeStart: handleHistoryResizeStart,
  } = useResizablePanel({
    initialWidth: 320,
    minWidth: 260,
    maxWidth: 520,
    invertDelta: isRtl,
  });

  useEffect(() => {
    selectedSourceIdsRef.current = selectedSourceIds;
  }, [selectedSourceIds]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    chatSessionIdRef.current = chatSessionId;
  }, [chatSessionId]);

  useEffect(() => {
    if (!isAdmin && currentView === 'sources') {
      setCurrentView('chat');
    }
  }, [currentView, isAdmin]);

  useEffect(() => {
    if (isGuest) {
      setGuestInfoOpen(true);
    }
  }, [isGuest]);

  const activeSources: ActiveSourceSet = useMemo(
    () => buildActiveSourceSet(sources, selectedSourceIds),
    [sources, selectedSourceIds]
  );
  const pendingFeedbackMessageId = useMemo(() => {
    const latestAssistantAnswer = latestFeedbackEligibleMessage(messages);
    if (!latestAssistantAnswer || latestAssistantAnswer.feedback) {
      return undefined;
    }
    return latestAssistantAnswer.id;
  }, [messages]);
  const completedRatedTurnCount = useMemo(
    () =>
      messages.filter(
        (message) => isFeedbackEligibleMessage(message) && Boolean(message.feedback)
      ).length,
    [messages]
  );
  const canEndTest = useMemo(
    () => messages.some((message) => isFeedbackEligibleMessage(message)),
    [messages]
  );
  const guestQuestionCount = useMemo(
    () => messages.filter((message) => message.role === 'user').length,
    [messages]
  );
  const patientContextText = useMemo(() => buildPatientContextText(patientContext), [patientContext]);
  const effectivePatientContextText = useMemo(
    () => patientContextText || persistedPatientContextText,
    [patientContextText, persistedPatientContextText]
  );

  const appendSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('system'),
        role: 'system',
        content,
        timestamp: nowIso(),
      },
    ]);
  }, []);

  const resetSessionFlowState = useCallback(() => {
    setSessionEnded(false);
    setCheckpointPromptShown(false);
    setCheckpointDialogOpen(false);
    setSurveyDialogOpen(false);
    setIsFinalizingSession(false);
    setSurveyOverallRating(null);
    setSurveyWorkflowFit('');
    setSurveyNotes('');
    setSelectedFeatureVotes([]);
    setSurveyEntryPoint('');
    setSurveySubmitError('');
    setSessionEndSummary(null);
  }, []);

  const appendSourceGreeting = useCallback((sourceIds: string[], switched: boolean) => {
    const titles = selectedSourceTitles(sources, sourceIds);
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: buildGreeting(t, titles, switched),
        timestamp: nowIso(),
        sourceSwitch: true,
      },
    ]);
  }, [sources, t]);

  const refreshSessionHistory = useCallback(
    async (preferredSessionId?: string) => {
      if (isGuest) {
        setSessionHistory([]);
        setIsLoadingSessionHistory(false);
        return;
      }
      setIsLoadingSessionHistory(true);
      try {
        const sessions = await listChatSessions();
        setSessionHistory(sessions);
        if (preferredSessionId && !sessions.some((session) => session.sessionId === preferredSessionId)) {
          setChatSessionId('');
        }
      } catch (error) {
        const message = isApiError(error)
          ? error.message
          : t('chat.loadChatSessionFailed');
        appendSystemMessage(message);
      } finally {
        setIsLoadingSessionHistory(false);
      }
    },
    [appendSystemMessage, isGuest, t]
  );

  const initialize = useCallback(async () => {
    setServiceStatus('warming');
    setStartupError('');
    try {
      const [status, sourceData, llmData, sessions] = await Promise.all([
        getServiceStatus(),
        getSources(),
        getLlmOptions(),
        isGuest ? Promise.resolve([]) : listChatSessions(),
      ]);
      const normalized = normalizeSourceSelection(
        sourceData.defaultSourceId ? [sourceData.defaultSourceId] : [],
        sourceData.sources,
        sourceData.defaultSourceId,
        sourceData.maxSelectedSources,
        t
      );

      setServiceStatus(status);
      setSources(sourceData.sources);
      setDefaultSourceId(sourceData.defaultSourceId);
      setMaxSelectedSources(sourceData.maxSelectedSources);
      setSelectedSourceIds(normalized.ids);
      setLlmOptions(llmData.options);
      setCanSelectLlm(llmData.canSelect);
      setSelectedLlmOptionId(llmData.selectedOptionId || llmData.defaultOptionId || llmData.options[0]?.id || '');
      setSessionHistory(sessions);
      setChatSessionId('');
      setPersistedPatientContextText('');
      resetSessionFlowState();
      setMessages([
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          content: buildGreeting(t, selectedSourceTitles(sourceData.sources, normalized.ids), false),
          timestamp: nowIso(),
          sourceSwitch: true,
        },
      ]);
      for (const warning of normalized.warnings) {
        appendSystemMessage(warning);
      }
    } catch (error) {
      if (!isGuest && isApiError(error) && error.status === 401) {
        window.location.href = '/login?next=/chat';
        return;
      }
      const message = isApiError(error) ? error.message : t('chat.initFailed');
      setStartupError(message);
      setServiceStatus('offline');
    }
  }, [appendSystemMessage, isGuest, resetSessionFlowState, t]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const status = await getServiceStatus();
        setServiceStatus(status);
      } catch {
        setServiceStatus('offline');
      }
    }, STATUS_POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isGuest || sessionEnded || checkpointPromptShown) {
      return;
    }
    if (completedRatedTurnCount >= CHECKPOINT_TURN_TARGET) {
      setCheckpointDialogOpen(true);
      setCheckpointPromptShown(true);
    }
  }, [completedRatedTurnCount, checkpointPromptShown, isGuest, sessionEnded]);

  const refreshSources = useCallback(
    async (preferredIds?: string[], appendGreeting?: boolean) => {
      setIsRefreshingSources(true);
      try {
        const sourceData = await getSources();
        setSources(sourceData.sources);
        setDefaultSourceId(sourceData.defaultSourceId);
        setMaxSelectedSources(sourceData.maxSelectedSources);

        const baseIds = preferredIds ?? selectedSourceIdsRef.current;
        const normalized = normalizeSourceSelection(
          baseIds,
          sourceData.sources,
          sourceData.defaultSourceId,
          sourceData.maxSelectedSources,
          t
        );
        const previousIds = selectedSourceIdsRef.current;
        const changed = !areIdListsEqual(previousIds, normalized.ids);
        setSelectedSourceIds(normalized.ids);

        if (appendGreeting && changed) {
          const titles = selectedSourceTitles(sourceData.sources, normalized.ids);
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId('assistant'),
              role: 'assistant',
              content: buildGreeting(t, titles, true),
              timestamp: nowIso(),
              sourceSwitch: true,
            },
          ]);
        }

        for (const warning of normalized.warnings) {
          appendSystemMessage(warning);
        }
      } catch (error) {
        const message = isApiError(error) ? error.message : t('chat.refreshSourcesFailed');
        appendSystemMessage(message);
      } finally {
        setIsRefreshingSources(false);
      }
    },
    [appendSystemMessage, t]
  );

  // Poll build progress for sources that are still building, so the source cards can show a
  // live status bar instead of a silent multi-minute wait. We stop polling a source once it
  // is ready or has errored, and refresh the source list when a build completes.
  const pendingBuildIds = useMemo(
    () =>
      sources
        .filter((source) => source.status === 'pending')
        .map((source) => source.id)
        .filter((id) => buildProgressById[id]?.state !== 'error'),
    [sources, buildProgressById]
  );
  const pendingBuildKey = pendingBuildIds.join(',');

  useEffect(() => {
    if (!pendingBuildKey) {
      return;
    }
    const ids = pendingBuildKey.split(',');
    let cancelled = false;

    const tick = async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return { id, data: await getSourceBuildStatus(id) };
          } catch {
            return { id, data: null };
          }
        })
      );
      if (cancelled) {
        return;
      }
      setBuildProgressById((prev) => {
        const next = { ...prev };
        for (const result of results) {
          if (result.data) {
            next[result.id] = result.data.progress;
          }
        }
        return next;
      });
      const anyCompleted = results.some(
        (result) =>
          result.data &&
          (result.data.missingFiles.length === 0 ||
            result.data.progress.state === 'done' ||
            result.data.source.ready)
      );
      if (anyCompleted && !cancelled) {
        void refreshSources();
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), BUILD_STATUS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pendingBuildKey, refreshSources]);

  const handleSourceChange = useCallback(
    (nextSources: ActiveSourceSet) => {
      const requestedIds = sourceIdsFromActiveSet(nextSources);
      const normalized = normalizeSourceSelection(
        requestedIds,
        sources,
        defaultSourceId,
        maxSelectedSources,
        t
      );
      if (areIdListsEqual(selectedSourceIds, normalized.ids)) {
        return;
      }
      setSelectedSourceIds(normalized.ids);
      appendSourceGreeting(normalized.ids, true);
      for (const warning of normalized.warnings) {
        appendSystemMessage(warning);
      }
    },
    [
      appendSourceGreeting,
      appendSystemMessage,
      defaultSourceId,
      maxSelectedSources,
      selectedSourceIds,
      sources,
      t,
    ]
  );

  const handleSubmitMessageFeedback = useCallback(
    async (messageId: string, feedback: { rating: FeedbackRating; notes: string }) => {
      const target = messagesRef.current.find((message) => message.id === messageId);
      if (!target) {
        return;
      }
      const sessionId = (target.sessionId || chatSessionId).trim();
      const turnId = (target.turnId || '').trim();
      if (!sessionId || !turnId) {
        appendSystemMessage(t('chat.feedbackMissingIds'));
        return;
      }
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                feedbackSaving: true,
                feedbackError: undefined,
              }
            : message
        )
      );
      try {
        const persisted = await submitChatFeedback({
          sessionId,
          turnId,
          rating: feedback.rating,
          notes: feedback.notes,
        });
        const submittedRating =
          persisted.feedback.rating >= 1 && persisted.feedback.rating <= 5
            ? (persisted.feedback.rating as FeedbackRating)
            : feedback.rating;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  feedbackSaving: false,
                  feedbackError: undefined,
                  feedback: {
                    rating: submittedRating,
                    notes: persisted.feedback.notes,
                    submittedAt: persisted.feedback.submittedAt || nowIso(),
                  },
                }
              : message
          )
        );
      } catch (error) {
        const message = isApiError(error)
          ? error.message
          : t('chat.feedbackPersistFailed');
        setMessages((prev) =>
          prev.map((entry) =>
            entry.id === messageId
              ? {
                  ...entry,
                  feedbackSaving: false,
                  feedbackError: message,
                }
              : entry
          )
        );
        appendSystemMessage(message);
      }
    },
    [appendSystemMessage, chatSessionId, t]
  );

  const openSurveyDialog = useCallback((entryPoint: 'manual' | 'checkpoint') => {
    setSurveySubmitError('');
    setSurveyEntryPoint(entryPoint);
    setCheckpointDialogOpen(false);
    setSurveyDialogOpen(true);
  }, []);

  const handleEndTestClick = useCallback(() => {
    if (isGuest || !canEndTest || sessionEnded) {
      return;
    }
    openSurveyDialog('manual');
  }, [canEndTest, isGuest, openSurveyDialog, sessionEnded]);

  const handleContinueAfterCheckpoint = useCallback(() => {
    setCheckpointDialogOpen(false);
  }, []);

  const handleFeatureVoteToggle = useCallback((featureId: string) => {
    setSelectedFeatureVotes((currentVotes) =>
      currentVotes.includes(featureId)
        ? currentVotes.filter((value) => value !== featureId)
        : [...currentVotes, featureId]
    );
  }, []);

  const handleSurveySubmit = useCallback(async () => {
    if (isFinalizingSession) {
      return;
    }
    if (!surveyOverallRating || !surveyWorkflowFit) {
      setSurveySubmitError(t('chat.surveyRatingWorkflowRequired'));
      return;
    }
    const sessionId = chatSessionId.trim();
    if (!sessionId) {
      setSurveySubmitError(t('chat.noActiveSession'));
      return;
    }

    setIsFinalizingSession(true);
    setSurveySubmitError('');
    try {
      const finalized = await finalizeChatSession({
        sessionId,
        survey: {
          overall_rating: surveyOverallRating,
          workflow_fit: surveyWorkflowFit,
          notes: surveyNotes.trim(),
          completed_rated_turns: completedRatedTurnCount,
          checkpoint_turn_target: CHECKPOINT_TURN_TARGET,
          end_trigger: surveyEntryPoint || 'manual',
        },
        featureVotes: selectedFeatureVotes,
      });
      const featureVoteLabels = selectedFeatureVotes
        .map((voteId) => getNextFeatureOptions(t).find((option) => option.id === voteId)?.label || voteId)
        .filter(Boolean);
      setSessionEndSummary({
        completedAt: finalized.completedAt || nowIso(),
        overallRating: surveyOverallRating,
        workflowFit: surveyWorkflowFit,
        notes: surveyNotes.trim(),
        featureVoteLabels,
        endTrigger: surveyEntryPoint || 'manual',
      });
      setChatSessionId(finalized.sessionId || sessionId);
      void refreshSessionHistory(finalized.sessionId || sessionId);
      setSessionEnded(true);
      setSurveyDialogOpen(false);
      setCheckpointDialogOpen(false);
      appendSystemMessage(t('chat.testSessionEnded'));
    } catch (error) {
      const message = isApiError(error)
        ? error.message
        : t('chat.feedbackPersistFailed');
      setSurveySubmitError(message);
      appendSystemMessage(message);
    } finally {
      setIsFinalizingSession(false);
    }
  }, [
    appendSystemMessage,
    chatSessionId,
    completedRatedTurnCount,
    isFinalizingSession,
    selectedFeatureVotes,
    surveyEntryPoint,
    surveyNotes,
    surveyOverallRating,
    surveyWorkflowFit,
    refreshSessionHistory,
    t,
  ]);

  const applyGuestAutoEndIfLimitReached = useCallback(
    (nextQuestionCount: number) => {
      if (!isGuest || nextQuestionCount < GUEST_QUESTION_LIMIT) {
        return;
      }
      setSessionEnded(true);
      setCheckpointDialogOpen(false);
      setSurveyDialogOpen(false);
      setSessionEndSummary({
        completedAt: nowIso(),
        overallRating: 0,
        workflowFit: 'guest_limit',
        notes: '',
        featureVoteLabels: [],
        endTrigger: 'auto-guest-limit',
      });
      appendSystemMessage(t('chat.guestLimitReached', { limit: GUEST_QUESTION_LIMIT }));
    },
    [appendSystemMessage, isGuest, t]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      const question = content.trim();
      if (!question || isLoading || pendingFeedbackMessageId || sessionEnded) {
        return;
      }
      if (isGuest && guestQuestionCount >= GUEST_QUESTION_LIMIT) {
        applyGuestAutoEndIfLimitReached(guestQuestionCount);
        return;
      }

      const historySnapshot = [...messages];
      const selectedIdsSnapshot = [...selectedSourceIds];
      const sessionIdSnapshot = chatSessionId;
      const patientContextSnapshot = effectivePatientContextText;
      const nextQuestionCount = guestQuestionCount + 1;
      const userMessage: ChatMessage = {
        id: createMessageId('user'),
        role: 'user',
        content: question,
        timestamp: nowIso(),
        patientContextEnabled: patientContext.enabled,
      };
      const assistantMessageId = createMessageId('assistant');
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: nowIso(),
          isStreaming: true,
          question,
        },
      ]);
      setIsLoading(true);
      setServiceStatus((prev) => (prev === 'offline' ? 'retrying' : prev));

      const finalizeResponse = (
        answer: string,
        citations: Citation[],
        safety: SafetyFlags,
        turnId: string,
        responseSessionId: string
      ) => {
        const reason = safetyReason(safety, t);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: answer,
                  citations,
                  isStreaming: false,
                  safetyFiltered: Boolean(reason),
                  safetyFilterReason: reason || undefined,
                  question,
                  sessionId: responseSessionId || message.sessionId || sessionIdSnapshot,
                  turnId: turnId || message.turnId,
                }
              : message
          )
        );
      };

      try {
        await streamChat(
          {
            question,
            history: historySnapshot,
            selectedSourceIds: selectedIdsSnapshot,
            llmOptionId: selectedLlmOptionId,
            sessionId: sessionIdSnapshot,
            patientContext: patientContextSnapshot,
            patientContextEnabled: patientContext.enabled,
          },
          {
            onToken: (chunk) => {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? { ...message, content: `${message.content}${chunk}` }
                    : message
                )
              );
            },
            onReplace: (safeContent, safety) => {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        content: safeContent,
                        safetyFiltered: Boolean(safetyReason(safety, t)),
                        safetyFilterReason: safetyReason(safety, t) || undefined,
                      }
                    : message
                )
              );
            },
            onError: (errorMessage) => {
              appendSystemMessage(errorMessage);
            },
            onDone: (response) => {
              finalizeResponse(
                response.answer,
                response.citations,
                response.safety,
                response.turnId,
                response.sessionId
              );
              if (response.sessionId) {
                setChatSessionId(response.sessionId);
              }
              if (response.llmOptionId) {
                setSelectedLlmOptionId(response.llmOptionId);
              }
              if (response.warnings.length > 0) {
                for (const warning of response.warnings) {
                  appendSystemMessage(warning);
                }
              }
              if (
                response.selectedSourceIds.length > 0 &&
                !areIdListsEqual(response.selectedSourceIds, selectedSourceIdsRef.current)
              ) {
                setSelectedSourceIds(response.selectedSourceIds);
              }
              setPersistedPatientContextText(patientContextSnapshot);
              if (!isGuest) {
                void refreshSessionHistory(response.sessionId || sessionIdSnapshot);
              }
              applyGuestAutoEndIfLimitReached(nextQuestionCount);
            },
          }
        );
        setServiceStatus('online');
      } catch (streamError) {
        try {
          const fallback = await sendChat({
            question,
            history: historySnapshot,
            selectedSourceIds: selectedIdsSnapshot,
            llmOptionId: selectedLlmOptionId,
            sessionId: sessionIdSnapshot,
            patientContext: patientContextSnapshot,
            patientContextEnabled: patientContext.enabled,
          });
          finalizeResponse(
            fallback.answer,
            fallback.citations,
            fallback.safety,
            fallback.turnId,
            fallback.sessionId
          );
          if (fallback.sessionId) {
            setChatSessionId(fallback.sessionId);
          }
          if (fallback.llmOptionId) {
            setSelectedLlmOptionId(fallback.llmOptionId);
          }
          if (fallback.warnings.length > 0) {
            for (const warning of fallback.warnings) {
              appendSystemMessage(warning);
            }
          }
          setPersistedPatientContextText(patientContextSnapshot);
          if (!isGuest) {
            void refreshSessionHistory(fallback.sessionId || sessionIdSnapshot);
          }
          applyGuestAutoEndIfLimitReached(nextQuestionCount);
          setServiceStatus('degraded');
        } catch (fallbackError) {
          const message = isApiError(fallbackError)
            ? fallbackError.message
            : t('chat.retrieveAnswerFailed');
          setMessages((prev) =>
            prev.map((entry) =>
              entry.id === assistantMessageId
                ? {
                    ...entry,
                    content: `ERROR: ${message}`,
                    isStreaming: false,
                  }
                : entry
            )
          );
          setServiceStatus('offline');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      appendSystemMessage,
      applyGuestAutoEndIfLimitReached,
      chatSessionId,
      guestQuestionCount,
      isGuest,
      isLoading,
      messages,
      pendingFeedbackMessageId,
      patientContext.enabled,
      effectivePatientContextText,
      refreshSessionHistory,
      selectedLlmOptionId,
      selectedSourceIds,
      sessionEnded,
      t,
    ]
  );

  const handleTranscribeAudio = useCallback(
    async (audioFile: File) => {
      const response = await transcribeAudio({ file: audioFile });
      if (response.warnings.includes('low_confidence')) {
        appendSystemMessage(t('chat.voiceLowConfidence'));
      }
      return response.text;
    },
    [appendSystemMessage, t]
  );

  const handleCitationResolve = useCallback(async (citation: Citation, question: string) => {
    if (!question.trim()) {
      return citation;
    }
    try {
      return await resolveCitationHighlight(question, citation);
    } catch {
      return citation;
    }
  }, []);

  const handleUploadSource = useCallback(
    async (payload: { title: string; scopeType: KnowledgeSource['scopeType']; scopeValue: string; files: File[] }) => {
      const uploaded = await uploadSource({
        title: payload.title,
        scopeType: payload.scopeType,
        scopeValue: payload.scopeValue,
        files: payload.files,
        build: true,
      });

      if (!uploaded.ready) {
        setBuildProgressById((prev) => ({
          ...prev,
          [uploaded.id]: {
            state: 'running',
            stage: 'queued',
            percent: 1,
            message: t('chat.buildQueued'),
            error: '',
            updatedAt: '',
          },
        }));
      }

      const current = selectedSourceIdsRef.current;
      let preferredIds: string[];
      if (uploaded.scopeType === 'country') {
        const nonCountry = sources
          .filter((source) => source.scopeType !== 'country' && current.includes(source.id))
          .map((source) => source.id);
        preferredIds = [uploaded.id, ...nonCountry];
      } else {
        preferredIds = [uploaded.id, ...current];
      }
      await refreshSources(preferredIds, true);
    },
    [refreshSources, sources, t]
  );

  const handleAddDocumentToSource = useCallback(
    async (source: KnowledgeSource, payload: { title: string; file: File }) => {
      const updated = await addSourceDocument({
        sourceId: source.id,
        title: payload.title,
        file: payload.file,
        build: true,
      });

      setBuildProgressById((prev) => ({
        ...prev,
        [updated.id]: {
          state: 'running',
          stage: 'queued',
          percent: 1,
          message: t('chat.collectionRebuildQueued'),
          error: '',
          updatedAt: '',
        },
      }));
      await refreshSources(selectedSourceIdsRef.current, false);
      appendSystemMessage(t('chat.documentAdded', { title: source.title }));
    },
    [appendSystemMessage, refreshSources, t]
  );

  const handleDeleteSource = useCallback(
    async (source: KnowledgeSource) => {
      const wasSelected = selectedSourceIdsRef.current.includes(source.id);
      const result = await deleteSource(source.id);
      await refreshSources();
      if (wasSelected) {
        appendSystemMessage(t('chat.sourceDeleted', { title: source.title }));
      }
      for (const warning of result.warnings) {
        appendSystemMessage(warning);
      }
    },
    [appendSystemMessage, refreshSources, t]
  );

  const handleViewIngestionPreview = useCallback(
    async (source: KnowledgeSource) => getSourceIngestionPreview(source.id),
    []
  );

  const handleViewSourceDocuments = useCallback(
    async (source: KnowledgeSource) => getSourceDocuments(source.id),
    []
  );

  const handleDeleteSourceDocument = useCallback(
    async (source: KnowledgeSource, document: SourceDocument) => {
      const result = await deleteSourceDocument(source.id, document.id);
      if (result.building) {
        setBuildProgressById((prev) => ({
          ...prev,
          [source.id]: {
            state: 'running',
            stage: 'queued',
            percent: 1,
            message: t('chat.collectionRebuildQueued'),
            error: '',
            updatedAt: '',
          },
        }));
      }
      await refreshSources(selectedSourceIdsRef.current, false);
      for (const warning of result.warnings) {
        appendSystemMessage(warning);
      }
    },
    [appendSystemMessage, refreshSources, t]
  );

  const handleRebuildSource = useCallback(
    async (source: KnowledgeSource, settings: SourceRebuildSettings) => {
      await rebuildSourceWithSettings(source.id, settings);
      await refreshSources();
      appendSystemMessage(t('chat.sourceRebuilt', { title: source.title }));
    },
    [appendSystemMessage, refreshSources, t]
  );

  const handleRetry = useCallback(async () => {
    try {
      const status = await getServiceStatus();
      setServiceStatus(status);
      await Promise.all([refreshSources(), refreshSessionHistory(chatSessionIdRef.current)]);
      if (status !== 'offline') {
        setStartupError('');
      }
    } catch {
      setServiceStatus('offline');
    }
  }, [refreshSessionHistory, refreshSources]);

  const handleSessionSelect = useCallback(
    async (sessionId: string) => {
      if (isGuest) {
        return;
      }
      const normalizedSessionId = sessionId.trim();
      if (!normalizedSessionId || normalizedSessionId === chatSessionIdRef.current) {
        return;
      }
      setLoadingSessionId(normalizedSessionId);
      try {
        const detail = await getChatSessionDetail(normalizedSessionId);
        const normalizedSources = normalizeSourceSelection(
          detail.selectedSourceIds,
          sources,
          defaultSourceId,
          maxSelectedSources,
          t
        );
        if (normalizedSources.ids.length > 0) {
          setSelectedSourceIds(normalizedSources.ids);
        }

        const reconstructedMessages: ChatMessage[] = [
          {
            id: createMessageId('assistant'),
            role: 'assistant',
            content: buildGreeting(
              t,
              selectedSourceTitles(
                sources,
                normalizedSources.ids.length > 0 ? normalizedSources.ids : selectedSourceIdsRef.current
              ),
              false
            ),
            timestamp: detail.createdAt || nowIso(),
            sourceSwitch: true,
          },
        ];
        for (const turn of detail.turns) {
          reconstructedMessages.push({
            id: createMessageId('user'),
            role: 'user',
            content: turn.question,
            timestamp: turn.timestamp || nowIso(),
            patientContextEnabled: Boolean((turn.patientContext || '').trim()),
          });
          reconstructedMessages.push({
            id: createMessageId('assistant'),
            role: 'assistant',
            content: turn.answer,
            question: turn.question,
            timestamp: turn.timestamp || nowIso(),
            citations: turn.citations,
            sessionId: detail.sessionId,
            turnId: turn.turnId,
            feedback: turn.feedback
              ? {
                  rating:
                    turn.feedback.rating >= 1 && turn.feedback.rating <= 5
                      ? (turn.feedback.rating as FeedbackRating)
                      : 3,
                  notes: turn.feedback.notes,
                  submittedAt: turn.feedback.submittedAt || nowIso(),
                }
              : undefined,
          });
        }

        setChatSessionId(detail.sessionId);
        setPersistedPatientContextText(detail.patientContext || '');
        setMessages(reconstructedMessages);
        resetSessionFlowState();
      } catch (error) {
        const message = isApiError(error) ? error.message : t('chat.loadSessionFailed');
        appendSystemMessage(message);
      } finally {
        setLoadingSessionId('');
      }
    },
    [
      appendSystemMessage,
      defaultSourceId,
      isGuest,
      maxSelectedSources,
      resetSessionFlowState,
      sources,
      t,
    ]
  );

  const handleLlmOptionChange = useCallback(
    (optionId: string) => {
      const normalized = optionId.trim();
      if (!normalized) {
        return;
      }
      if (!canSelectLlm) {
        appendSystemMessage(t('chat.modelFixedForRole'));
        return;
      }
      if (normalized === selectedLlmOptionId) {
        return;
      }
      const label = llmOptions.find((option) => option.id === normalized)?.label || normalized;
      setSelectedLlmOptionId(normalized);
      appendSystemMessage(t('chat.modelSwitched', { label }));
    },
    [appendSystemMessage, canSelectLlm, llmOptions, selectedLlmOptionId, t]
  );

  const handleLogout = useCallback(async () => {
    if (isGuest) {
      window.location.href = '/login?next=/chat';
      return;
    }
    try {
      await logoutSession();
      window.location.href = '/login?next=/chat';
    } catch (error) {
      const message = isApiError(error) ? error.message : t('chat.logoutFailed');
      appendSystemMessage(message);
    }
  }, [appendSystemMessage, isGuest, t]);

  const handleLogin = useCallback(() => {
    window.location.href = '/login?next=/chat';
  }, []);

  const handleNewChat = useCallback(() => {
    setChatSessionId('');
    setPersistedPatientContextText('');
    resetSessionFlowState();
    setMessages([
      {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: buildGreeting(t, selectedSourceTitles(sources, selectedSourceIds), false),
        timestamp: nowIso(),
        sourceSwitch: true,
      },
    ]);
  }, [resetSessionFlowState, selectedSourceIds, sources, t]);

  if (startupError && sources.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-semibold">{t('chat.backendFailed')}</h1>
          <p className="text-sm text-muted-foreground">{startupError}</p>
          <Button onClick={() => void initialize()}>{t('chat.retryInit')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ServiceStatusBanner status={serviceStatus} onRetry={handleRetry} />
      <AppHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        canManageSources={isAdmin}
        sources={sources}
        activeSources={activeSources}
        onSourceChange={handleSourceChange}
        llmOptions={llmOptions}
        selectedLlmOptionId={selectedLlmOptionId}
        canSelectLlm={canSelectLlm}
        onSelectLlmOption={handleLlmOptionChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLogin={handleLogin}
        serviceStatus={serviceStatus}
        onOpenHistory={() => setMobileHistoryOpen(true)}
      />
      <DisclaimerBanner variant="dismissible" compact />
      {currentView === 'chat' ? (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {historySidebarOpen ? (
            <div style={{ width: historySidebarWidth }} className="relative hidden shrink-0 md:flex">
              <ChatHistorySidebar
                sessions={sessionHistory}
                activeSessionId={chatSessionId}
                isLoading={isLoadingSessionHistory}
                loadingSessionId={loadingSessionId}
                isGuest={isGuest}
                onNewChat={handleNewChat}
                onSignIn={handleLogin}
                onHide={() => setHistorySidebarOpen(false)}
                onSelectSession={(sessionId) => void handleSessionSelect(sessionId)}
              />
              <div
                className="absolute inset-y-0 end-0 z-10 w-1.5 cursor-col-resize bg-transparent transition hover:bg-border/60"
                onPointerDown={handleHistoryResizeStart}
              />
            </div>
          ) : (
            <div className="hidden w-12 shrink-0 flex-col items-center gap-2 border-r border-border bg-card/40 py-2 md:flex">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setHistorySidebarOpen(true)}
                title={t('chat.showSessionHistory')}
              >
                <PanelLeftOpen className="h-4 w-4" />
                <span className="sr-only">{t('chat.showSessionHistory')}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleNewChat}
                title={t('chat.startNewChat')}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">{t('chat.newChat')}</span>
              </Button>
              {isGuest && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleLogin}
                  title={t('chat.loginToSaveHistory')}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="sr-only">{t('header.login')}</span>
                </Button>
              )}
            </div>
          )}
          <ChatWorkspace
            messages={messages}
            userAvatarUrl={currentUser?.provider === 'google' ? currentUser.avatarUrl : ''}
            onSendMessage={handleSendMessage}
            onTranscribeAudio={handleTranscribeAudio}
            pendingFeedbackMessageId={pendingFeedbackMessageId}
            onSubmitMessageFeedback={handleSubmitMessageFeedback}
            completedRatedTurns={completedRatedTurnCount}
            checkpointTurnTarget={CHECKPOINT_TURN_TARGET}
            canEndTest={!isGuest && canEndTest}
            onEndTest={handleEndTestClick}
            sessionEnded={sessionEnded}
            sessionEndSummary={sessionEndSummary}
            patientContext={patientContext}
            onPatientContextChange={setPatientContext}
            chatDisabledReason={sessionEnded ? t('chat.sessionEndedDisabled') : undefined}
            isLoading={isLoading}
            sources={sources}
            activeSources={activeSources}
            onSourceChange={handleSourceChange}
            onResolveCitation={handleCitationResolve}
            isGuest={isGuest}
            guestQuestionCount={guestQuestionCount}
            guestQuestionLimit={GUEST_QUESTION_LIMIT}
            historySidebarOverlayOffset={historySidebarOpen ? historySidebarWidth : 48}
          />
        </div>
      ) : (
        <SourcesPage
          sources={sources}
          buildProgressById={buildProgressById}
          canUpload={isAdmin}
          canDelete={isAdmin}
          canPreview={isAdmin}
          isRefreshing={isRefreshingSources}
          onRefresh={() => refreshSources()}
          onUpload={handleUploadSource}
          onAddDocument={handleAddDocumentToSource}
          onDelete={handleDeleteSource}
          onViewSourceDocuments={handleViewSourceDocuments}
          onDeleteSourceDocument={handleDeleteSourceDocument}
          onViewIngestionPreview={handleViewIngestionPreview}
          onRebuildSource={handleRebuildSource}
        />
      )}

      <Dialog open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <DialogContent className="h-[86vh] max-w-xl overflow-hidden p-0">
          <ChatHistorySidebar
            sessions={sessionHistory}
            activeSessionId={chatSessionId}
            isLoading={isLoadingSessionHistory}
            loadingSessionId={loadingSessionId}
            isGuest={isGuest}
            className="h-full border-r-0"
            onNewChat={handleNewChat}
            onSignIn={handleLogin}
            onHide={() => setMobileHistoryOpen(false)}
            onSelectSession={(sessionId) => {
              void handleSessionSelect(sessionId);
              setMobileHistoryOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <SessionFlowDialogs
        isGuest={isGuest}
        guestInfoOpen={guestInfoOpen}
        setGuestInfoOpen={setGuestInfoOpen}
        onGuestLogin={handleLogin}
        guestQuestionLimit={GUEST_QUESTION_LIMIT}
        checkpointDialogOpen={checkpointDialogOpen}
        setCheckpointDialogOpen={setCheckpointDialogOpen}
        completedRatedTurnCount={completedRatedTurnCount}
        onContinueAfterCheckpoint={handleContinueAfterCheckpoint}
        onOpenSurveyFromCheckpoint={() => openSurveyDialog('checkpoint')}
        surveyDialogOpen={surveyDialogOpen}
        setSurveyDialogOpen={setSurveyDialogOpen}
        isFinalizingSession={isFinalizingSession}
        surveyOverallRating={surveyOverallRating}
        setSurveyOverallRating={(rating) => setSurveyOverallRating(rating)}
        surveyWorkflowFit={surveyWorkflowFit}
        setSurveyWorkflowFit={(value) => setSurveyWorkflowFit(value)}
        surveyNotes={surveyNotes}
        setSurveyNotes={setSurveyNotes}
        selectedFeatureVotes={selectedFeatureVotes}
        onToggleFeatureVote={handleFeatureVoteToggle}
        surveySubmitError={surveySubmitError}
        onSubmitSurvey={() => void handleSurveySubmit()}
      />
    </div>
  );
}
