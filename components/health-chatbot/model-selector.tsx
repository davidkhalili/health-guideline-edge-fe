'use client';

import type { LlmOption } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Lock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelSelectorProps {
  options: LlmOption[];
  selectedOptionId: string;
  canSelect: boolean;
  disabled?: boolean;
  onSelect: (optionId: string) => void;
}

export function ModelSelector({
  options,
  selectedOptionId,
  canSelect,
  disabled = false,
  onSelect,
}: ModelSelectorProps) {
  const { t } = useI18n();
  const selectedLabel =
    options.find((option) => option.id === selectedOptionId)?.label || t('common.model');

  return (
    <div className="flex items-center gap-2">
      {!canSelect && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
      <Select
        value={selectedOptionId}
        onValueChange={onSelect}
        disabled={disabled || !canSelect}
      >
        <SelectTrigger
          className="h-8 min-w-[170px]"
          aria-label={t('modelSelector.ariaLabel')}
          title={canSelect ? t('modelSelector.canSelect') : t('modelSelector.fixedByPolicy')}
        >
          <SelectValue placeholder={selectedLabel} />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
