'use client';

import React from 'react';
import { useWindowManager } from '@/lib/window-manager/use-window-manager';
import { ChevronDown } from 'lucide-react';

export function Taskbar() {
  const { state, focusWindow, maximizeWindow } = useWindowManager();

  const openWindows = Object.values(state.windows).filter((w) => w.isOpen);

  if (openWindows.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center gap-1 px-2 py-1 bg-card border-t"
      style={{
        borderColor: 'var(--border)',
        height: '40px',
        zIndex: 50,
      }}
    >
      {openWindows.map((window) => (
        <button
          key={window.id}
          onClick={() => {
            if (window.isMinimized) {
              maximizeWindow(window.id);
            } else {
              focusWindow(window.id);
            }
          }}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors truncate flex items-center gap-1 ${
            state.focusedWindowId === window.id
              ? 'bg-accent text-accent-foreground'
              : 'bg-muted hover:bg-muted/80 text-foreground'
          }`}
          style={{
            maxWidth: '150px',
          }}
          title={window.title}
        >
          <span className="truncate">{window.title}</span>
          {window.isMinimized && <ChevronDown size={12} />}
        </button>
      ))}
    </div>
  );
}
