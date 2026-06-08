'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { useWindowManager } from '@/lib/window-manager/use-window-manager';
import { X, Minus } from 'lucide-react';

interface WindowComponentProps {
  id: string;
  title: string;
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
}

export function WindowComponent({
  id,
  title,
  children,
  minWidth = 300,
  minHeight = 200,
  defaultWidth = 500,
  defaultHeight = 400,
  defaultX = 100,
  defaultY = 100,
}: WindowComponentProps) {
  const { state, updateWindowPosition, updateWindowSize, focusWindow, closeWindow, minimizeWindow } =
    useWindowManager();
  const windowRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

  const windowState = state.windows[id];
  const isFocused = state.focusedWindowId === id;

  // Initialize window on mount
  useEffect(() => {
    if (!windowState) {
      // Window not yet opened, don't do anything
      return;
    }
  }, [windowState, id]);

  // Handle title bar drag
  useEffect(() => {
    if (!isDragging || !titleBarRef.current || !windowRef.current) return;

    function handleMouseMove(e: MouseEvent) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updateWindowPosition(id, { x: newX, y: newY });
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, updateWindowPosition]);

  // Handle resize
  useEffect(() => {
    if (!isResizing || !resizeRef.current) return;

    function handleMouseMove(e: MouseEvent) {
      const newWidth = Math.max(
        minWidth,
        e.clientX - (windowState?.position.x || defaultX) - resizeStart.x
      );
      const newHeight = Math.max(
        minHeight,
        e.clientY - (windowState?.position.y || defaultY) - resizeStart.y
      );
      updateWindowSize(id, { width: newWidth, height: newHeight });
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, id, minWidth, minHeight, windowState?.position.x, windowState?.position.y, defaultX, defaultY, updateWindowSize]);

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (!windowRef.current) return;
    focusWindow(id);
    setIsDragging(true);
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    focusWindow(id);
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  if (!windowState) {
    return null;
  }

  const x = windowState.position.x;
  const y = windowState.position.y;
  const width = windowState.size.width;
  const height = windowState.size.height;
  const zIndex = windowState.zIndex;

  return (
    <div
      ref={windowRef}
      className="fixed bg-card text-foreground flex flex-col shadow-lg"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
        border: `1px solid var(--border)`,
        borderRadius: '2px',
        visibility: windowState.isMinimized ? 'hidden' : 'visible',
      }}
      onMouseDown={() => focusWindow(id)}
    >
      {/* Title Bar */}
      <div
        ref={titleBarRef}
        className="flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing select-none bg-card"
        style={{
          borderColor: 'var(--border)',
          minHeight: '36px',
        }}
        onMouseDown={handleTitleMouseDown}
      >
        <h3 className="text-sm font-semibold truncate flex-1 pointer-events-none">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(id);
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(id);
            }}
            className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{ pointerEvents: 'auto' }}>
        {children}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-accent/30"
        style={{
          borderLeft: `1px solid var(--border)`,
          borderTop: `1px solid var(--border)`,
        }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}
