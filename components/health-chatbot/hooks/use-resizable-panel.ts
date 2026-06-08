'use client';

import { useCallback, useState } from 'react';

interface UseResizablePanelInput {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  direction?: 'expand_right' | 'expand_left';
  /** Flip drag direction (required for expand_left panels mirrored in RTL). */
  invertDelta?: boolean;
}

export function useResizablePanel({
  initialWidth,
  minWidth,
  maxWidth,
  direction = 'expand_right',
  invertDelta = false,
}: UseResizablePanelInput) {
  const [width, setWidth] = useState(initialWidth);

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const startX = event.clientX;
      const startWidth = width;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const pointerDelta = moveEvent.clientX - startX;
        const delta = invertDelta ? -pointerDelta : pointerDelta;
        const rawWidth = direction === 'expand_left' ? startWidth - delta : startWidth + delta;
        const clampedWidth = Math.min(maxWidth, Math.max(minWidth, rawWidth));
        setWidth(clampedWidth);
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [direction, invertDelta, maxWidth, minWidth, width]
  );

  return {
    width,
    setWidth,
    handleResizeStart,
  };
}

