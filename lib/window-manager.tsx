'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface WindowState {
  id: string;
  title: string;
  icon?: ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  content: ReactNode;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
}

interface WindowManagerContext {
  windows: WindowState[];
  openWindow: (config: Omit<WindowState, 'zIndex'>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  isWindowOpen: (id: string) => boolean;
  topZIndex: number;
}

const WindowManagerCtx = createContext<WindowManagerContext | null>(null);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const zCounter = useRef(100);

  const nextZ = useCallback(() => {
    zCounter.current += 1;
    return zCounter.current;
  }, []);

  const openWindow = useCallback(
    (config: Omit<WindowState, 'zIndex'>) => {
      setWindows((prev) => {
        const existing = prev.find((w) => w.id === config.id);
        if (existing) {
          return prev.map((w) =>
            w.id === config.id
              ? { ...w, minimized: false, zIndex: nextZ() }
              : w
          );
        }
        return [...prev, { ...config, zIndex: nextZ() }];
      });
    },
    [nextZ]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ() } : w))
      );
    },
    [nextZ]
  );

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: true } : w))
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, minimized: false, maximized: false } : w
      )
    );
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y } : w))
    );
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, width, height } : w))
    );
  }, []);

  const isWindowOpen = useCallback(
    (id: string) => windows.some((w) => w.id === id),
    [windows]
  );

  return (
    <WindowManagerCtx.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        focusWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        moveWindow,
        resizeWindow,
        isWindowOpen,
        topZIndex: zCounter.current,
      }}
    >
      {children}
    </WindowManagerCtx.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerCtx);
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return ctx;
}

export function useWindowDrag(
  windowId: string,
  initialX: number,
  initialY: number
) {
  const { moveWindow, focusWindow } = useWindowManager();
  const isDragging = useRef(false);
  const startPos = useRef({ mouseX: 0, mouseY: 0, winX: initialX, winY: initialY });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      startPos.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        winX: initialX,
        winY: initialY,
      };
      focusWindow(windowId);

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const dx = ev.clientX - startPos.current.mouseX;
        const dy = ev.clientY - startPos.current.mouseY;
        const newX = Math.max(0, startPos.current.winX + dx);
        const newY = Math.max(0, startPos.current.winY + dy);
        moveWindow(windowId, newX, newY);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [windowId, initialX, initialY, focusWindow, moveWindow]
  );

  return handleMouseDown;
}
