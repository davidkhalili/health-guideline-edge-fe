import type { ActiveSourceSet, KnowledgeSource } from '@/lib/types';

function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function buildActiveSourceSet(
  sources: KnowledgeSource[],
  selectedSourceIds: string[]
): ActiveSourceSet {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const selectedSources = dedupeIds(selectedSourceIds)
    .map((id) => sourceById.get(id))
    .filter((source): source is KnowledgeSource => Boolean(source));

  const countrySource = selectedSources.find((source) => source.scopeType === 'country');
  const globalSources = selectedSources.filter((source) => source.scopeType !== 'country');
  return { countrySource, globalSources };
}

export function sourceIdsFromActiveSet(activeSources: ActiveSourceSet): string[] {
  const ids = [
    activeSources.countrySource?.id ?? '',
    ...activeSources.globalSources.map((source) => source.id),
  ];
  return dedupeIds(ids);
}

export function selectedSourceTitles(
  sources: KnowledgeSource[],
  selectedSourceIds: string[]
): string[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  return dedupeIds(selectedSourceIds)
    .map((id) => sourceById.get(id))
    .filter((source): source is KnowledgeSource => Boolean(source))
    .map((source) => source.title);
}
