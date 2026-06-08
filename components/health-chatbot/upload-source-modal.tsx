'use client';

import { useMemo, useState } from 'react';
import type { SourceScope } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Upload } from 'lucide-react';

interface UploadSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: {
    title: string;
    scopeType: SourceScope;
    scopeValue: string;
    files: File[];
  }) => Promise<void>;
}

export function UploadSourceModal({ open, onOpenChange, onUpload }: UploadSourceModalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [scopeType, setScopeType] = useState<SourceScope>('custom');
  const [scopeValue, setScopeValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const scopeValueLabel = useMemo(() => {
    if (scopeType === 'country') {
      return t('upload.countryName');
    }
    if (scopeType === 'regional') {
      return t('upload.regionName');
    }
    if (scopeType === 'global') {
      return t('upload.organization');
    }
    return t('upload.descriptionLabel');
  }, [scopeType, t]);

  const scopeValuePlaceholder = useMemo(() => {
    if (scopeType === 'country') {
      return t('upload.countryPlaceholder');
    }
    if (scopeType === 'global') {
      return t('upload.globalPlaceholder');
    }
    if (scopeType === 'regional') {
      return t('upload.regionalPlaceholder');
    }
    return t('upload.customPlaceholder');
  }, [scopeType, t]);

  const resetForm = () => {
    setTitle('');
    setScopeType('custom');
    setScopeValue('');
    setFiles([]);
    setError('');
    setIsUploading(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const canSubmit =
    files.length > 0 && title.trim().length > 0 && scopeValue.trim().length > 0 && !isUploading;

  const handleSubmit = async () => {
    if (files.length === 0 || !canSubmit) {
      return;
    }
    setIsUploading(true);
    setError('');
    try {
      await onUpload({
        title: title.trim(),
        scopeType,
        scopeValue: scopeValue.trim(),
        files,
      });
      handleClose(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t('upload.uploadFailed'));
      setIsUploading(false);
    }
  };

  const filesSelectedLabel =
    files.length === 1
      ? t('upload.fileSelected')
      : t('upload.filesSelected', { count: files.length });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('upload.title')}</DialogTitle>
          <DialogDescription>{t('upload.description')}</DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source-file">{t('upload.pdfFiles')}</Label>
            <Input
              id="source-file"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                setFiles(nextFiles);
              }}
              disabled={isUploading}
            />
            {files.length > 0 && <p className="text-xs text-muted-foreground">{filesSelectedLabel}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-title">{t('upload.sourceTitle')}</Label>
            <Input
              id="source-title"
              placeholder={t('upload.sourceTitlePlaceholder')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-scope-type">{t('upload.scopeType')}</Label>
            <Select
              value={scopeType}
              onValueChange={(value) => setScopeType(value as SourceScope)}
              disabled={isUploading}
            >
              <SelectTrigger id="source-scope-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="country">{t('sources.scopeCountry')}</SelectItem>
                <SelectItem value="global">{t('sources.scopeGlobal')}</SelectItem>
                <SelectItem value="regional">{t('sources.scopeRegional')}</SelectItem>
                <SelectItem value="custom">{t('sources.scopeCustom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-scope-value">{scopeValueLabel}</Label>
            <Input
              id="source-scope-value"
              placeholder={scopeValuePlaceholder}
              value={scopeValue}
              onChange={(event) => setScopeValue(event.target.value)}
              disabled={isUploading}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isUploading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('common.uploading')}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 me-2" />
                {t('upload.uploadAndBuild')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
