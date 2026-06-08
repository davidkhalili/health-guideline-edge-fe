import type { Locale, Messages, TranslateFn, TranslationValues } from './types';
import { en } from './messages/en';
import { fa } from './messages/fa';

export const LOCALE_STORAGE_KEY = 'health-guideline-edge-locale';

const messagesByLocale: Record<Locale, Messages> = {
  en,
  fa,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'fa';
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore storage failures
  }
}

function getNestedValue(messages: Messages, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function createTranslator(locale: Locale): TranslateFn {
  const messages = messagesByLocale[locale];
  return (key: string, values?: TranslationValues) => {
    const template = getNestedValue(messages, key) ?? key;
    if (!values) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (_, token: string) => {
      const value = values[token];
      return value === undefined ? `{${token}}` : String(value);
    });
  };
}

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale];
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

export type { Locale, Messages, TranslateFn, TranslationValues, FeatureOption } from './types';
