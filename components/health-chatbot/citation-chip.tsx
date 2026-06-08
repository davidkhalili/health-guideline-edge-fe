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
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all',
        'border hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        isActive 
          ? 'bg-primary text-primary-foreground border-primary' 
          : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30'
      )}
      title={`${citation.sourceTitle} - ${citation.sectionTitle}`}
    >
      <span className={cn(
        'flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold',
        isActive 
          ? 'bg-primary-foreground/20 text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        {index}
      </span>
      <FileText className="h-3 w-3" />
      <span className="max-w-[120px] truncate">{citation.sectionId}</span>
    </button>
  );
}
