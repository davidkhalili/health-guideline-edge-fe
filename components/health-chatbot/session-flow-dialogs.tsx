'use client';

import { useMemo } from 'react';
import type { FeedbackRating } from '@/lib/types';
import { getNextFeatureOptions } from './chat-runtime';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SessionFlowDialogsProps {
  isGuest: boolean;
  guestInfoOpen: boolean;
  setGuestInfoOpen: (open: boolean) => void;
  onGuestLogin: () => void;
  guestQuestionLimit: number;

  checkpointDialogOpen: boolean;
  setCheckpointDialogOpen: (open: boolean) => void;
  completedRatedTurnCount: number;
  onContinueAfterCheckpoint: () => void;
  onOpenSurveyFromCheckpoint: () => void;

  surveyDialogOpen: boolean;
  setSurveyDialogOpen: (open: boolean) => void;
  isFinalizingSession: boolean;
  surveyOverallRating: FeedbackRating | null;
  setSurveyOverallRating: (rating: FeedbackRating) => void;
  surveyWorkflowFit: 'yes' | 'no' | 'maybe' | '';
  setSurveyWorkflowFit: (value: 'yes' | 'no' | 'maybe') => void;
  surveyNotes: string;
  setSurveyNotes: (value: string) => void;
  selectedFeatureVotes: string[];
  onToggleFeatureVote: (featureId: string) => void;
  surveySubmitError: string;
  onSubmitSurvey: () => void;
}

export function SessionFlowDialogs({
  isGuest,
  guestInfoOpen,
  setGuestInfoOpen,
  onGuestLogin,
  guestQuestionLimit,
  checkpointDialogOpen,
  setCheckpointDialogOpen,
  completedRatedTurnCount,
  onContinueAfterCheckpoint,
  onOpenSurveyFromCheckpoint,
  surveyDialogOpen,
  setSurveyDialogOpen,
  isFinalizingSession,
  surveyOverallRating,
  setSurveyOverallRating,
  surveyWorkflowFit,
  setSurveyWorkflowFit,
  surveyNotes,
  setSurveyNotes,
  selectedFeatureVotes,
  onToggleFeatureVote,
  surveySubmitError,
  onSubmitSurvey,
}: SessionFlowDialogsProps) {
  const { t } = useI18n();
  const featureOptions = useMemo(() => getNextFeatureOptions(t), [t]);

  const workflowFitOptions = useMemo(
    () => [
      { id: 'yes' as const, label: t('common.yes') },
      { id: 'maybe' as const, label: t('common.maybe') },
      { id: 'no' as const, label: t('common.no') },
    ],
    [t]
  );

  return (
    <>
      <Dialog open={guestInfoOpen && isGuest} onOpenChange={setGuestInfoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('chat.guestSessionActive')}</DialogTitle>
            <DialogDescription>{t('chat.guestSessionDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>- {t('chat.guestDialog1')}</p>
            <p>- {t('chat.guestDialog2', { limit: guestQuestionLimit })}</p>
            <p>- {t('chat.guestDialog3')}</p>
            <p>- {t('chat.guestDialog4')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuestInfoOpen(false)}>
              {t('auth.continueAsGuest')}
            </Button>
            <Button onClick={onGuestLogin}>{t('chat.loginNow')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkpointDialogOpen} onOpenChange={setCheckpointDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('chat.checkpointTitle')}</DialogTitle>
            <DialogDescription>
              {t('chat.checkpointDesc', { count: completedRatedTurnCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onContinueAfterCheckpoint}>
              {t('chat.continueTest')}
            </Button>
            <Button onClick={onOpenSurveyFromCheckpoint}>{t('chat.endTest')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('chat.surveyTitle')}</DialogTitle>
            <DialogDescription>{t('chat.surveyDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <section className="space-y-2">
              <p className="text-sm font-medium">{t('chat.surveyOverallRequired')}</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSurveyOverallRating(value as FeedbackRating)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      surveyOverallRating === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent/70 dark:hover:bg-accent/40 hover:text-foreground dark:hover:text-foreground'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-sm font-medium">{t('chat.surveyWorkflowRequired')}</p>
              <div className="flex flex-wrap gap-2">
                {workflowFitOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSurveyWorkflowFit(option.id)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      surveyWorkflowFit === option.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent/70 dark:hover:bg-accent/40 hover:text-foreground dark:hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-sm font-medium">{t('chat.surveyCommentsOptional')}</p>
              <textarea
                value={surveyNotes}
                onChange={(event) => setSurveyNotes(event.target.value)}
                rows={3}
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                placeholder={t('chat.surveyCommentsPlaceholder')}
              />
            </section>

            <section className="space-y-2">
              <p className="text-sm font-medium">{t('chat.surveyFeatureVotes')}</p>
              <div className="flex flex-wrap gap-2">
                {featureOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onToggleFeatureVote(option.id)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      selectedFeatureVotes.includes(option.id)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent/70 dark:hover:bg-accent/40 hover:text-foreground dark:hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {surveySubmitError && <p className="text-sm text-destructive">{surveySubmitError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSurveyDialogOpen(false)} disabled={isFinalizingSession}>
              {t('common.back')}
            </Button>
            <Button onClick={onSubmitSurvey} disabled={isFinalizingSession}>
              {isFinalizingSession ? t('common.submitting') : t('chat.submitAndEndTest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
