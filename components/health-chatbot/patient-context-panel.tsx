'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PatientContext } from '@/lib/types';
import type { TranslateFn } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { hasPatientContextDetails } from '@/lib/patient-context';

interface PatientContextPanelProps {
  context: PatientContext;
  onChange: (next: PatientContext) => void;
  disabled?: boolean;
  className?: string;
}

function biologicalSexLabel(value: string, t: TranslateFn): string {
  const labels: Record<string, string> = {
    Female: t('patientContext.female'),
    Male: t('patientContext.male'),
    Intersex: t('patientContext.intersex'),
    Other: t('patientContext.other'),
    Unknown: t('patientContext.unknown'),
  };
  return labels[value] || value;
}

function pregnancyStatusLabel(value: string, t: TranslateFn): string {
  const labels: Record<string, string> = {
    Pregnant: t('patientContext.pregnant'),
    'Not pregnant': t('patientContext.notPregnant'),
    Unknown: t('patientContext.unknown'),
    'Not applicable': t('patientContext.notApplicable'),
  };
  return labels[value] || value;
}

export function PatientContextPanel({
  context,
  onChange,
  disabled = false,
  className,
}: PatientContextPanelProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftContext, setDraftContext] = useState<PatientContext>(context);

  useEffect(() => {
    setDraftContext(context);
  }, [context]);

  const hasSavedDetails = hasPatientContextDetails(context);
  const hasDraftDetails = hasPatientContextDetails(draftContext);
  const compactSummary = useMemo(() => {
    const parts: string[] = [];
    if (context.ageYears.trim()) {
      parts.push(t('patientContext.ageSummary', { age: context.ageYears.trim() }));
    }
    if (context.biologicalSex.trim()) {
      parts.push(biologicalSexLabel(context.biologicalSex.trim(), t));
    }
    if (context.pregnancyStatus.trim()) {
      parts.push(pregnancyStatusLabel(context.pregnancyStatus.trim(), t));
    }
    if (context.weightKg.trim()) {
      parts.push(t('patientContext.weightSummary', { weight: context.weightKg.trim() }));
    }
    if (context.keyConditions.trim()) {
      parts.push(
        t('patientContext.conditionsSummary', {
          text: context.keyConditions.trim().slice(0, 38),
        })
      );
    }
    if (!parts.length) {
      return context.enabled
        ? t('patientContext.enabledNoDetails')
        : t('patientContext.disabledNoInjection');
    }
    return parts.join(' · ');
  }, [
    context.ageYears,
    context.biologicalSex,
    context.enabled,
    context.keyConditions,
    context.pregnancyStatus,
    context.weightKg,
    t,
  ]);

  const updateField = (field: keyof PatientContext, value: string | boolean) => {
    setDraftContext({
      ...draftContext,
      [field]: value,
    });
  };

  const clearDraftDetails = () => {
    setDraftContext({
      ...draftContext,
      ageYears: '',
      biologicalSex: '',
      pregnancyStatus: '',
      weightKg: '',
      keyConditions: '',
      currentMedications: '',
      additionalNotes: '',
    });
  };

  const openEditor = (forceEnable: boolean) => {
    setDraftContext({
      ...context,
      enabled: forceEnable ? true : context.enabled,
    });
    setIsExpanded(true);
  };

  const confirmChanges = () => {
    onChange({
      ...draftContext,
    });
    setIsExpanded(false);
  };

  const cancelChanges = () => {
    setDraftContext(context);
    setIsExpanded(false);
  };

  const disableContext = () => {
    onChange({
      ...context,
      enabled: false,
    });
    setIsExpanded(false);
  };

  return (
    <div className={cn('rounded-lg border border-border bg-muted/25 p-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{t('patientContext.title')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('patientContext.description')}</p>
        </div>
        {!isExpanded && (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {context.enabled ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEditor(false)}
                  disabled={disabled}
                  className="h-7 whitespace-nowrap text-xs"
                >
                  {t('patientContext.viewEdit')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={disableContext}
                  disabled={disabled}
                  className="h-7 whitespace-nowrap text-xs"
                >
                  {t('patientContext.disable')}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEditor(true)}
                disabled={disabled}
                className="h-7 whitespace-nowrap text-xs"
              >
                {t('patientContext.enable')}
              </Button>
            )}
          </div>
        )}
      </div>

      {!isExpanded && (
        <div className="mt-2 rounded-md border border-border bg-background px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                context.enabled
                  ? 'bg-clinical-success/15 text-clinical-success'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {context.enabled ? t('patientContext.enabled') : t('patientContext.disabled')}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {hasSavedDetails ? t('patientContext.detailsSaved') : t('patientContext.noDetailsSaved')}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{compactSummary}</p>
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-2 rounded-md border border-border bg-background px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-foreground">{t('patientContext.injectIntoPrompts')}</p>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={draftContext.enabled}
                onChange={(event) => updateField('enabled', event.target.checked)}
                disabled={disabled}
                className="h-3.5 w-3.5 rounded border-input"
              />
              {draftContext.enabled ? t('patientContext.enabled') : t('patientContext.disabled')}
            </label>
          </div>

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="patient-age-years" className="text-xs">
                {t('patientContext.ageYears')}
              </Label>
              <Input
                id="patient-age-years"
                value={draftContext.ageYears}
                onChange={(event) => updateField('ageYears', event.target.value)}
                placeholder={t('patientContext.agePlaceholder')}
                disabled={disabled || !draftContext.enabled}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-biological-sex" className="text-xs">
                {t('patientContext.biologicalSex')}
              </Label>
              <select
                id="patient-biological-sex"
                value={draftContext.biologicalSex}
                onChange={(event) => updateField('biologicalSex', event.target.value)}
                disabled={disabled || !draftContext.enabled}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
              >
                <option value="">{t('patientContext.notSpecified')}</option>
                <option value="Female">{t('patientContext.female')}</option>
                <option value="Male">{t('patientContext.male')}</option>
                <option value="Intersex">{t('patientContext.intersex')}</option>
                <option value="Other">{t('patientContext.other')}</option>
                <option value="Unknown">{t('patientContext.unknown')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-pregnancy-status" className="text-xs">
                {t('patientContext.pregnancyStatus')}
              </Label>
              <select
                id="patient-pregnancy-status"
                value={draftContext.pregnancyStatus}
                onChange={(event) => updateField('pregnancyStatus', event.target.value)}
                disabled={disabled || !draftContext.enabled}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
              >
                <option value="">{t('patientContext.notSpecified')}</option>
                <option value="Pregnant">{t('patientContext.pregnant')}</option>
                <option value="Not pregnant">{t('patientContext.notPregnant')}</option>
                <option value="Unknown">{t('patientContext.unknown')}</option>
                <option value="Not applicable">{t('patientContext.notApplicable')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-weight-kg" className="text-xs">
                {t('patientContext.weightKg')}
              </Label>
              <Input
                id="patient-weight-kg"
                value={draftContext.weightKg}
                onChange={(event) => updateField('weightKg', event.target.value)}
                placeholder={t('patientContext.weightPlaceholder')}
                disabled={disabled || !draftContext.enabled}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="patient-key-conditions" className="text-xs">
                {t('patientContext.keyConditions')}
              </Label>
              <textarea
                id="patient-key-conditions"
                value={draftContext.keyConditions}
                onChange={(event) => updateField('keyConditions', event.target.value)}
                rows={2}
                placeholder={t('patientContext.conditionsPlaceholder')}
                disabled={disabled || !draftContext.enabled}
                className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-medications" className="text-xs">
                {t('patientContext.currentMedications')}
              </Label>
              <textarea
                id="patient-medications"
                value={draftContext.currentMedications}
                onChange={(event) => updateField('currentMedications', event.target.value)}
                rows={2}
                placeholder={t('patientContext.medicationsPlaceholder')}
                disabled={disabled || !draftContext.enabled}
                className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="patient-additional-context" className="text-xs">
              {t('patientContext.additionalContext')}
            </Label>
            <textarea
              id="patient-additional-context"
              value={draftContext.additionalNotes}
              onChange={(event) => updateField('additionalNotes', event.target.value)}
              rows={2}
              placeholder={t('patientContext.additionalPlaceholder')}
              disabled={disabled || !draftContext.enabled}
              className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={clearDraftDetails}
              disabled={disabled || !hasDraftDetails}
            >
              {t('patientContext.clearFields')}
            </Button>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={cancelChanges}
                disabled={disabled}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                onClick={confirmChanges}
                disabled={disabled}
              >
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
