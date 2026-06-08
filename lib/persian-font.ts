export const PERSIAN_FONT_STORAGE_KEY = 'health-guideline-edge-persian-font-preview';

export const PERSIAN_FONT_IDS = [
  'vazirmatn',
  'iransansx',
  'estedad',
  'yekan-bakh',
  'shabnam',
  'sahel',
] as const;

export type PersianFontId = (typeof PERSIAN_FONT_IDS)[number];

export interface PersianFontDefinition {
  id: PersianFontId;
  label: string;
  family: string;
  stylesheet: string;
}

export const PERSIAN_FONTS: Record<PersianFontId, PersianFontDefinition> = {
  vazirmatn: {
    id: 'vazirmatn',
    label: 'Vazirmatn',
    family: 'Vazirmatn',
    stylesheet: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  },
  iransansx: {
    id: 'iransansx',
    label: 'IRANSansX',
    family: 'IRANSansX',
    stylesheet: 'https://cdn.fontiran.com/css?family=IRANSansX:wght@100;200;300;400;500;600;700;800;900',
  },
  estedad: {
    id: 'estedad',
    label: 'Estedad',
    family: 'Estedad',
    stylesheet: 'https://fonts.googleapis.com/css2?family=Estedad:wght@100..900&display=swap',
  },
  'yekan-bakh': {
    id: 'yekan-bakh',
    label: 'Yekan Bakh',
    family: 'YekanBakh',
    stylesheet: 'https://cdn.jsdelivr.net/gh/AmirAbbasVafaee/persian-fonts-cdn@main/css/yekan-bakh.css',
  },
  shabnam: {
    id: 'shabnam',
    label: 'Shabnam',
    family: 'Shabnam',
    stylesheet: 'https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css',
  },
  sahel: {
    id: 'sahel',
    label: 'Sahel',
    family: 'Sahel',
    stylesheet: 'https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@v3.4.1/dist/font-face.css',
  },
};

export function isPersianFontId(value: string | null | undefined): value is PersianFontId {
  return Boolean(value && PERSIAN_FONT_IDS.includes(value as PersianFontId));
}

export function getDefaultPersianFontId(): PersianFontId {
  const configured = process.env.NEXT_PUBLIC_PERSIAN_FONT?.trim().toLowerCase();
  return isPersianFontId(configured) ? configured : 'vazirmatn';
}

export function isPersianFontPreviewEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PERSIAN_FONT_PREVIEW === 'true';
}

export function getPersianFontStylesheets(fontIds: PersianFontId[]): string[] {
  return [...new Set(fontIds.map((id) => PERSIAN_FONTS[id].stylesheet))];
}

export function getStoredPreviewPersianFontId(): PersianFontId | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(PERSIAN_FONT_STORAGE_KEY);
    return isPersianFontId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function persistPreviewPersianFontId(fontId: PersianFontId): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(PERSIAN_FONT_STORAGE_KEY, fontId);
  } catch {
    // ignore storage failures
  }
}

export function resolvePersianFontId(previewOverride?: PersianFontId | null): PersianFontId {
  if (isPersianFontPreviewEnabled() && previewOverride && isPersianFontId(previewOverride)) {
    return previewOverride;
  }
  return getDefaultPersianFontId();
}

export function applyPersianFont(fontId: PersianFontId): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset.persianFont = fontId;
}
