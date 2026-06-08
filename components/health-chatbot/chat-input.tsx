'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { Loader2, Mic, Send, Square } from 'lucide-react';

const MAX_RECORDING_DURATION_MS = 85_000;
const RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
] as const;

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }
  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  for (const candidate of RECORDING_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}

function extensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('ogg')) {
    return 'ogg';
  }
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) {
    return 'm4a';
  }
  return 'webm';
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onTranscribeAudio?: (audioFile: File) => Promise<string>;
  isLoading?: boolean;
  disabled?: boolean;
  blockedReason?: string;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onTranscribeAudio,
  isLoading = false,
  disabled = false,
  blockedReason,
  placeholder,
}: ChatInputProps) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceNotice, setVoiceNotice] = useState('');
  const [voiceUnavailableReason, setVoiceUnavailableReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingMimeTypeRef = useRef('');
  const recordingTimeoutRef = useRef<number | null>(null);
  const resolvedPlaceholder = placeholder ?? t('chat.placeholderDefault');

  const clearRecordingTimeout = useCallback(() => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  }, []);

  const cleanupActiveStream = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      return;
    }
    for (const track of stream.getTracks()) {
      track.stop();
    }
    streamRef.current = null;
  }, []);

  const resolveVoiceUnavailableReason = useCallback((): string => {
    if (!onTranscribeAudio) {
      return t('chat.voiceTranscribeUnavailable');
    }
    if (typeof window === 'undefined') {
      return '';
    }
    const mediaDevices = window.navigator.mediaDevices;
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
      return t('chat.voiceUnsupportedBrowser');
    }
    const hostname = window.location.hostname.toLowerCase();
    const isLocalhost =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    if (!window.isSecureContext && !isLocalhost) {
      return t('chat.voiceRequiresHttps');
    }
    if (typeof MediaRecorder === 'undefined') {
      return t('chat.voiceUnsupportedBrowser');
    }
    return '';
  }, [onTranscribeAudio, t]);

  useEffect(() => {
    setVoiceUnavailableReason(resolveVoiceUnavailableReason());
  }, [resolveVoiceUnavailableReason]);

  useEffect(
    () => () => {
      clearRecordingTimeout();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      cleanupActiveStream();
    },
    [clearRecordingTimeout, cleanupActiveStream]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled || isRecording || isTranscribing) {
      return;
    }
    onSend(trimmed);
    setValue('');
    setVoiceNotice('');
    setVoiceError('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleRecordingStop = useCallback(async () => {
    setIsRecording(false);
    clearRecordingTimeout();
    cleanupActiveStream();
    mediaRecorderRef.current = null;

    const mimeType = recordingMimeTypeRef.current || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (!blob.size) {
      setVoiceError(t('chat.voiceEmptyRecording'));
      setVoiceNotice('');
      return;
    }
    if (!onTranscribeAudio) {
      setVoiceError(t('chat.voiceTranscribeUnavailable'));
      setVoiceNotice('');
      return;
    }

    setIsTranscribing(true);
    setVoiceError('');
    try {
      const extension = extensionFromMimeType(blob.type || mimeType);
      const audioFile = new File([blob], `recording-${Date.now()}.${extension}`, {
        type: blob.type || mimeType,
      });
      const transcribedText = (await onTranscribeAudio(audioFile)).trim();
      if (!transcribedText) {
        setVoiceError(t('chat.voiceNoSpeechDetected'));
        setVoiceNotice('');
        return;
      }
      setValue((previous) => (previous ? `${previous}\n${transcribedText}` : transcribedText));
      setVoiceNotice(t('chat.voiceReadyToSend'));
      setVoiceError('');
      window.requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (error) {
      const fallback = t('chat.voiceTranscribeFailed');
      const message =
        error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
      setVoiceError(message);
      setVoiceNotice('');
    } finally {
      setIsTranscribing(false);
    }
  }, [cleanupActiveStream, clearRecordingTimeout, onTranscribeAudio, t]);

  const startRecording = useCallback(async () => {
    if (disabled || isLoading || isRecording || isTranscribing) {
      return;
    }
    const unavailableReason = resolveVoiceUnavailableReason();
    setVoiceUnavailableReason(unavailableReason);
    if (unavailableReason) {
      setVoiceError(unavailableReason);
      setVoiceNotice('');
      return;
    }

    setVoiceError('');
    setVoiceNotice('');
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = pickRecorderMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recordingMimeTypeRef.current = recorder.mimeType || preferredMimeType || 'audio/webm';

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        setVoiceError(t('chat.voiceRecordingFailed'));
        setVoiceNotice('');
      };
      recorder.onstop = () => {
        void handleRecordingStop();
      };

      recorder.start();
      setIsRecording(true);
      clearRecordingTimeout();
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          setVoiceNotice(t('chat.voiceAutoStopped'));
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_DURATION_MS);
    } catch (error) {
      clearRecordingTimeout();
      cleanupActiveStream();
      mediaRecorderRef.current = null;
      const name = error instanceof Error ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setVoiceError(t('chat.voicePermissionDenied'));
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setVoiceError(t('chat.voiceNoInputDevice'));
      } else {
        setVoiceError(t('chat.voiceAccessFailed'));
      }
      setVoiceNotice('');
      setIsRecording(false);
    }
  }, [
    cleanupActiveStream,
    clearRecordingTimeout,
    disabled,
    handleRecordingStop,
    isLoading,
    isRecording,
    isTranscribing,
    resolveVoiceUnavailableReason,
    t,
  ]);

  const stopRecording = useCallback(() => {
    clearRecordingTimeout();
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }
    recorder.stop();
  }, [clearRecordingTimeout]);

  const handleVoiceButtonClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const showVoiceButton = Boolean(onTranscribeAudio);
  const sendDisabled = !value.trim() || isLoading || disabled || isRecording || isTranscribing;
  const voiceDisabled =
    disabled || isLoading || isTranscribing || (!isRecording && Boolean(voiceUnavailableReason));
  const helperMessage =
    blockedReason ||
    voiceError ||
    (isRecording
      ? t('chat.voiceRecordingInProgress')
      : isTranscribing
        ? t('chat.voiceTranscribing')
        : voiceNotice || t('chat.pressEnterToSend'));
  const helperToneClass =
    blockedReason || voiceError
      ? 'text-clinical-caution'
      : voiceNotice
        ? 'text-clinical-success'
        : 'text-muted-foreground';

  return (
    <div className="relative">
      <div
        className={cn(
          'relative flex items-end gap-2 p-3 bg-card border border-border rounded-xl',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (voiceNotice) {
              setVoiceNotice('');
            }
            if (voiceError) {
              setVoiceError('');
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          disabled={disabled || isLoading || isTranscribing}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none min-h-[40px] max-h-[220px] py-2',
            'disabled:cursor-not-allowed'
          )}
          aria-label={t('chat.sendMessage')}
        />
        {showVoiceButton && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleVoiceButtonClick}
            disabled={voiceDisabled}
            title={
              isRecording
                ? t('chat.voiceStopRecording')
                : voiceUnavailableReason || t('chat.voiceRecordMessage')
            }
            className={cn(
              'h-8 w-8 flex-shrink-0 rounded-lg',
              isRecording &&
                'border-destructive/70 bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <Square className="h-3.5 w-3.5" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isRecording ? t('chat.voiceStopRecording') : t('chat.voiceRecordMessage')}
            </span>
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={sendDisabled}
          className={cn(
            'h-8 w-8 flex-shrink-0 rounded-lg',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sr-only">{t('chat.sendMessage')}</span>
        </Button>
      </div>
      <div className="flex items-center justify-between px-1 mt-2">
        <p className={cn('text-[10px]', helperToneClass)}>{helperMessage}</p>
        <p className="text-[10px] text-muted-foreground">{value.length}/4000</p>
      </div>
    </div>
  );
}
