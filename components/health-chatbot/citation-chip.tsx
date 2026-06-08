'use client';

import { cn } from '@/lib/utils';
import type { Citation } from '@/lib/types';
import { FileText } from 'lucide-react';

interface CitationChipProps {
  citation: Citation;
  index: number;
  onClick?: () => void;
  isActive?: boolean;
}

export function CitationChip({ citation, index, onClick, isActive }: CitationChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'citation-marker inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        isActive ? 'ring-2' : ''
      )}
      style={
        isActive
          ? { background: 'var(--amber)', color: 'var(--ink)', borderColor: 'var(--amber-dark)' }
          : { background: 'var(--paper-2)', color: 'var(--ink-light)', borderColor: 'var(--window-border)' }
      }
      title={`${citation.sourceTitle} - ${citation.sectionTitle}`}
    >
      <span
        className="flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold"
        style={isActive ? { background: 'var(--amber-dark)', color: 'var(--paper)' } : { background: 'var(--window-border)', color: 'var(--ink)' }}
      >
        {index}
      </span>
      <FileText className="h-3 w-3" />
      <span className="max-w-[120px] truncate">{citation.sectionId}</span>
    </button>
  );
}
