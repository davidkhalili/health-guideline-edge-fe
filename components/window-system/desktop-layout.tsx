'use client';

import React, { ReactNode } from 'react';
import { WindowManagerProvider } from '@/lib/window-manager/context';
import { Taskbar } from './taskbar';

interface DesktopLayoutProps {
  children: ReactNode;
  topBar?: ReactNode;
}

export function DesktopLayout({ children, topBar }: DesktopLayoutProps) {
  return (
    <WindowManagerProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        {/* Top Navigation Bar */}
        {topBar && (
          <div
            className="flex-shrink-0 border-b"
            style={{
              borderColor: 'var(--border)',
            }}
          >
            {topBar}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>

        {/* Taskbar */}
        <Taskbar />
      </div>
    </WindowManagerProvider>
  );
}
