'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Pill,
  Stethoscope,
  Baby,
  Heart,
  Activity,
  Syringe,
} from 'lucide-react';

interface EmptyChatStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function EmptyChatState({ onSuggestionClick }: EmptyChatStateProps) {
  const { t } = useI18n();

  const suggestionGroups = useMemo(
    () => [
      {
        category: t('chat.categoryTreatment'),
        icon: Pill,
        suggestions: [
          t('chat.suggestionTreatment1'),
          t('chat.suggestionTreatment2'),
          t('chat.suggestionTreatment3'),
        ],
      },
      {
        category: t('chat.categoryDiagnostic'),
        icon: Stethoscope,
        suggestions: [
          t('chat.suggestionDiagnostic1'),
          t('chat.suggestionDiagnostic2'),
          t('chat.suggestionDiagnostic3'),
        ],
      },
      {
        category: t('chat.categorySpecialPop'),
        icon: Baby,
        suggestions: [
          t('chat.suggestionSpecial1'),
          t('chat.suggestionSpecial2'),
          t('chat.suggestionSpecial3'),
        ],
      },
    ],
    [t]
  );

  const quickTopics = useMemo(
    () => [
      { label: t('chat.quickTopicMalaria'), icon: Activity, topicKey: 'malaria' },
      { label: t('chat.quickTopicHiv'), icon: Heart, topicKey: 'hiv' },
      { label: t('chat.quickTopicVaccination'), icon: Syringe, topicKey: 'vaccination' },
      { label: t('chat.quickTopicMaternal'), icon: Baby, topicKey: 'maternal' },
    ],
    [t]
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <MessageSquare className="h-10 w-10 text-primary" />
      </div>

      <h2 className="text-2xl font-semibold mb-2">{t('chat.howCanIHelp')}</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-8">{t('chat.emptyStateDesc')}</p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {quickTopics.map((topic) => (
          <Button
            key={topic.topicKey}
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onSuggestionClick(t('chat.quickTopicPrompt', { topic: topic.label }))}
          >
            <topic.icon className="h-3.5 w-3.5 me-1.5" />
            {topic.label}
          </Button>
        ))}
      </div>

      <div className="w-full max-w-3xl grid md:grid-cols-3 gap-4">
        {suggestionGroups.map((group) => (
          <div key={group.category} className="bg-card border border-border rounded-xl p-4 text-start">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <group.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">{group.category}</h3>
            </div>
            <div className="space-y-2">
              {group.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className={cn(
                    'w-full text-start text-xs text-muted-foreground',
                    'p-2.5 rounded-lg bg-muted/50 hover:bg-accent/70 dark:hover:bg-accent/40 hover:text-foreground dark:hover:text-foreground transition-colors',
                    'line-clamp-2'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 px-4 py-2.5 bg-muted/50 rounded-lg border border-border max-w-2xl">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">{t('disclaimer.emptyChatTitle')}</strong>{' '}
          {t('disclaimer.emptyChatBody')}
        </p>
      </div>
    </div>
  );
}
