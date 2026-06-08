'use client';

import type { TranslateFn } from '@/lib/i18n';
import type { KnowledgeSource, SafetyFlags } from '@/lib/types';

export const STATUS_POLL_INTERVAL_MS = 15000;
export const BUILD_STATUS_POLL_INTERVAL_MS = 2500;
export const CHECKPOINT_TURN_TARGET = 10;
export const GUEST_QUESTION_LIMIT = 10;

export const NEXT_FEATURE_OPTION_IDS = [
  'patient_context_defaults',
  'session_history_workspace',
  'multilingual_support',
  'multimodal_input',
  'source_lifecycle_tools',
] as const;

const FEATURE_LABEL_KEYS: Record<(typeof NEXT_FEATURE_OPTION_IDS)[number], string> = {
  patient_context_defaults: 'features.patientContextDefaults',
  session_history_workspace: 'features.sessionHistoryWorkspace',
  multilingual_support: 'features.multilingualSupport',
  multimodal_input: 'features.multimodalInput',
  source_lifecycle_tools: 'features.sourceLifecycleTools',
};

export function getNextFeatureOptions(t: TranslateFn): Array<{ id: string; label: string }> {
  return NEXT_FEATURE_OPTION_IDS.map((id) => ({
    id,
    label: t(FEATURE_LABEL_KEYS[id]),
  }));
}

export interface SessionEndSummary {
  completedAt: string;
  overallRating: number;
  workflowFit: string;
  notes: string;
  featureVoteLabels: string[];
  endTrigger: string;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createMessageId(role: 'assistant' | 'user' | 'system'): string {
  return `${role}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function areIdListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => item === b[index]);
}

export function normalizeSourceSelection(
  requestedIds: string[],
  sources: KnowledgeSource[],
  defaultSourceId: string,
  maxSelectedSources: number,
  t: TranslateFn
): { ids: string[]; warnings: string[] } {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const warnings: string[] = [];
  const dedupedIds: string[] = [];

  for (const id of requestedIds) {
    const trimmed = id.trim();
    if (!trimmed || dedupedIds.includes(trimmed) || !sourceById.has(trimmed)) {
      continue;
    }
    dedupedIds.push(trimmed);
  }

  let normalizedIds = dedupedIds;
  if (normalizedIds.length === 0 && defaultSourceId && sourceById.has(defaultSourceId)) {
    normalizedIds = [defaultSourceId];
  }

  const countryIds = normalizedIds.filter((id) => sourceById.get(id)?.scopeType === 'country');
  if (countryIds.length > 1) {
    const keptCountryId = countryIds[countryIds.length - 1];
    normalizedIds = normalizedIds.filter(
      (id) => sourceById.get(id)?.scopeType !== 'country' || id === keptCountryId
    );
    warnings.push(t('chat.sourceWarningCountry'));
  }

  if (normalizedIds.length > maxSelectedSources) {
    normalizedIds = normalizedIds.slice(0, maxSelectedSources);
    warnings.push(t('chat.sourceWarningCap', { max: maxSelectedSources }));
  }

  return { ids: normalizedIds, warnings };
}

export function buildGreeting(t: TranslateFn, sourceTitles: string[], switched: boolean): string {
  const sourcePreview = sourceTitles.length > 0 ? sourceTitles.join(', ') : t('chat.noActiveSource');
  if (switched) {
    return t('chat.sourceSetUpdated', { sources: sourcePreview });
  }
  return t('chat.greetingIntro', { sources: sourcePreview });
}

export function safetyReason(flags: SafetyFlags, t: TranslateFn): string {
  if (flags.dosageFiltered) {
    return t('chat.safetyDosageFiltered');
  }
  if (flags.languageFiltered) {
    return t('chat.safetyLanguageFiltered');
  }
  if (flags.structuralReferenceFiltered) {
    return t('chat.safetyStructuralFiltered');
  }
  return '';
}

export function workflowFitLabel(value: string, t: TranslateFn): string {
  if (value === 'guest_limit') {
    return t('chat.workflowFitGuestAuto');
  }
  if (value === 'yes') {
    return t('chat.workflowFitYes');
  }
  if (value === 'maybe') {
    return t('chat.workflowFitMaybe');
  }
  if (value === 'no') {
    return t('chat.workflowFitNo');
  }
  return value || t('chat.workflowFitNotProvided');
}

export function workflowFitClasses(value: string): string {
  if (value === 'guest_limit') {
    return 'border-clinical-caution/40 bg-clinical-caution/10 text-clinical-caution';
  }
  if (value === 'yes') {
    return 'border-clinical-success/40 bg-clinical-success/10 text-clinical-success';
  }
  if (value === 'maybe') {
    return 'border-clinical-warning/40 bg-clinical-warning/10 text-clinical-warning';
  }
  if (value === 'no') {
    return 'border-destructive/40 bg-destructive/10 text-destructive';
  }
  return 'border-border bg-muted text-muted-foreground';
}
