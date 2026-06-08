'use client';

import React, { useEffect } from 'react';
import { useWindowManager } from '@/lib/window-manager/use-window-manager';
import { WindowComponent } from '@/components/window-system/window-component';
import type { ChatMessage, PatientContext } from '@/lib/types';
import type { SessionEndSummary } from './chat-runtime';
import { ChatWorkspace } from './chat-workspace';
import { PatientContextPanel } from './patient-context-panel';
import { SourceViewerPanel } from './source-viewer-panel';

interface ChatWorkspaceWindowedProps {
  messages: ChatMessage[];
  userAvatarUrl?: string;
  onSendMessage: (message: string) => void;
  onTranscribeAudio?: (audioFile: File) => Promise<string>;
  pendingFeedbackMessageId?: string;
  onSubmitMessageFeedback?: (messageId: string, feedback: { rating: number; notes: string }) => void;
  completedRatedTurns?: number;
  checkpointTurnTarget?: number;
  canEndTest?: boolean;
  onEndTest?: () => void;
  chatDisabledReason?: string;
  sessionEnded?: boolean;
  sessionEndSummary?: SessionEndSummary | null;
  patientContext: PatientContext;
  onPatientContextChange: (next: PatientContext) => void;
  isLoading?: boolean;
  selectedCitationId?: string;
  onSelectCitation?: (citationId: string) => void;
  sessionHistoryPanelOpen?: boolean;
  onToggleSessionHistoryPanel?: (open: boolean) => void;
  currentActiveSources?: { title: string; sourceId: string; readyChunks: number }[];
  globalCountIfApplicable?: number;
}

export function ChatWorkspaceWindowed(props: ChatWorkspaceWindowedProps) {
  const { openWindow, closeWindow } = useWindowManager();

  // Initialize windows on mount
  useEffect(() => {
    // Open main chat window
    openWindow({
      id: 'chat-main',
      title: 'Chat',
      isOpen: true,
      isMinimized: false,
      position: { x: 20, y: 80 },
      size: { width: 700, height: 600 },
    });

    // Open patient context window
    openWindow({
      id: 'patient-context',
      title: 'Patient Context',
      isOpen: true,
      isMinimized: false,
      position: { x: 750, y: 80 },
      size: { width: 300, height: 400 },
    });

    // Open source viewer window
    openWindow({
      id: 'source-viewer',
      title: 'Source Viewer',
      isOpen: false,
      isMinimized: false,
      position: { x: 750, y: 500 },
      size: { width: 300, height: 300 },
    });
  }, [openWindow]);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* Chat Window */}
      <WindowComponent
        id="chat-main"
        title="Chat"
        defaultWidth={700}
        defaultHeight={600}
        defaultX={20}
        defaultY={80}
      >
        <div className="overflow-hidden">
          <ChatWorkspace {...props} />
        </div>
      </WindowComponent>

      {/* Patient Context Window */}
      <WindowComponent
        id="patient-context"
        title="Patient Context"
        defaultWidth={300}
        defaultHeight={400}
        defaultX={750}
        defaultY={80}
      >
        <div className="p-4 overflow-auto h-full">
          <PatientContextPanel
            value={props.patientContext}
            onChange={props.onPatientContextChange}
          />
        </div>
      </WindowComponent>

      {/* Source Viewer Window */}
      <WindowComponent
        id="source-viewer"
        title="Source Viewer"
        defaultWidth={300}
        defaultHeight={300}
        defaultX={750}
        defaultY={500}
      >
        <div className="p-4 overflow-auto h-full">
          {props.selectedCitationId ? (
            <SourceViewerPanel citationId={props.selectedCitationId} />
          ) : (
            <p className="text-xs text-muted-foreground">Click a citation to view source</p>
          )}
        </div>
      </WindowComponent>
    </div>
  );
}
