'use client';

import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PERSIAN_FONT_IDS, PERSIAN_FONTS } from '@/lib/persian-font';
import { usePersianFont } from '@/lib/persian-font-context';
import { useI18n } from '@/lib/i18n/context';

interface PersianFontPreviewProps {
  className?: string;
}

export function PersianFontPreview({ className }: PersianFontPreviewProps) {
  const { locale } = useI18n();
  const { fontId, previewEnabled, setPreviewFontId } = usePersianFont();

  if (!previewEnabled) {
    return null;
  }

  const activeLabel = PERSIAN_FONTS[fontId].label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-8 gap-1.5 border-dashed border-clinical-warning/50 text-clinical-warning hover:text-clinical-warning',
            className
          )}
          title="Temporary font preview (set NEXT_PUBLIC_PERSIAN_FONT when done)"
        >
          <Type className="h-3.5 w-3.5" />
          <span className="hidden max-w-[120px] truncate sm:inline">{activeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Persian font preview
        </DropdownMenuLabel>
        {PERSIAN_FONT_IDS.map((id) => (
          <DropdownMenuItem
            key={id}
            onClick={() => setPreviewFontId(id)}
            className={cn(fontId === id && 'bg-accent')}
          >
            {PERSIAN_FONTS[id].label}
          </DropdownMenuItem>
        ))}
        {locale !== 'fa' && (
          <p className="px-2 py-1.5 text-[10px] text-muted-foreground">
            Switch to Persian to preview fonts.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
