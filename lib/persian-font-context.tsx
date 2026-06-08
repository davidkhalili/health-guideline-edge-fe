'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyPersianFont,
  getDefaultPersianFontId,
  getStoredPreviewPersianFontId,
  isPersianFontPreviewEnabled,
  persistPreviewPersianFontId,
  type PersianFontId,
} from './persian-font';

interface PersianFontContextValue {
  fontId: PersianFontId;
  defaultFontId: PersianFontId;
  previewEnabled: boolean;
  setPreviewFontId: (fontId: PersianFontId) => void;
}

const PersianFontContext = createContext<PersianFontContextValue | null>(null);

export function PersianFontProvider({ children }: { children: React.ReactNode }) {
  const defaultFontId = getDefaultPersianFontId();
  const previewEnabled = isPersianFontPreviewEnabled();
  const [previewFontId, setPreviewFontIdState] = useState<PersianFontId | null>(null);

  useEffect(() => {
    if (!previewEnabled) {
      applyPersianFont(defaultFontId);
      return;
    }
    const stored = getStoredPreviewPersianFontId();
    const initial = stored ?? defaultFontId;
    setPreviewFontIdState(initial);
    applyPersianFont(initial);
  }, [defaultFontId, previewEnabled]);

  const setPreviewFontId = useCallback(
    (nextFontId: PersianFontId) => {
      if (!previewEnabled) {
        return;
      }
      setPreviewFontIdState(nextFontId);
      persistPreviewPersianFontId(nextFontId);
      applyPersianFont(nextFontId);
    },
    [previewEnabled]
  );

  const fontId = previewEnabled ? previewFontId ?? defaultFontId : defaultFontId;

  const value = useMemo<PersianFontContextValue>(
    () => ({
      fontId,
      defaultFontId,
      previewEnabled,
      setPreviewFontId,
    }),
    [defaultFontId, fontId, previewEnabled, setPreviewFontId]
  );

  return <PersianFontContext.Provider value={value}>{children}</PersianFontContext.Provider>;
}

export function usePersianFont(): PersianFontContextValue {
  const context = useContext(PersianFontContext);
  if (!context) {
    throw new Error('usePersianFont must be used within PersianFontProvider');
  }
  return context;
}
