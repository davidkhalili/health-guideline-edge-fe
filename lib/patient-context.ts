import type { PatientContext } from '@/lib/types';

const MAX_PATIENT_CONTEXT_CHARS = 1500;

export function emptyPatientContext(): PatientContext {
  return {
    enabled: false,
    ageYears: '',
    biologicalSex: '',
    pregnancyStatus: '',
    weightKg: '',
    keyConditions: '',
    currentMedications: '',
    additionalNotes: '',
  };
}

export function hasPatientContextDetails(context: PatientContext): boolean {
  return Boolean(
    context.ageYears.trim() ||
      context.biologicalSex.trim() ||
      context.pregnancyStatus.trim() ||
      context.weightKg.trim() ||
      context.keyConditions.trim() ||
      context.currentMedications.trim() ||
      context.additionalNotes.trim()
  );
}

export function buildPatientContextText(context: PatientContext): string {
  if (!context.enabled) {
    return '';
  }
  const lines: string[] = [];
  if (context.ageYears.trim()) {
    lines.push(`Age: ${context.ageYears.trim()} years`);
  }
  if (context.biologicalSex.trim()) {
    lines.push(`Biological sex: ${context.biologicalSex.trim()}`);
  }
  if (context.pregnancyStatus.trim()) {
    lines.push(`Pregnancy status: ${context.pregnancyStatus.trim()}`);
  }
  if (context.weightKg.trim()) {
    lines.push(`Weight: ${context.weightKg.trim()} kg`);
  }
  if (context.keyConditions.trim()) {
    lines.push(`Key conditions: ${context.keyConditions.trim()}`);
  }
  if (context.currentMedications.trim()) {
    lines.push(`Current medications: ${context.currentMedications.trim()}`);
  }
  if (context.additionalNotes.trim()) {
    lines.push(`Additional context: ${context.additionalNotes.trim()}`);
  }
  const text = lines.join('\n').trim();
  if (!text) {
    return '';
  }
  if (text.length <= MAX_PATIENT_CONTEXT_CHARS) {
    return text;
  }
  return text.slice(0, MAX_PATIENT_CONTEXT_CHARS).trimEnd();
}
