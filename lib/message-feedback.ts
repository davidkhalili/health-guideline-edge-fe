import type { ChatMessage } from '@/lib/types';

export function isFeedbackEligibleMessage(message: ChatMessage): boolean {
  if (message.role !== 'assistant') {
    return false;
  }
  if (message.sourceSwitch || message.isStreaming) {
    return false;
  }
  if (!message.question?.trim()) {
    return false;
  }
  if (!message.turnId?.trim()) {
    return false;
  }
  const content = message.content.trim();
  if (!content || content.startsWith('ERROR:')) {
    return false;
  }
  return true;
}

export function latestFeedbackEligibleMessage(messages: ChatMessage[]): ChatMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (isFeedbackEligibleMessage(candidate)) {
      return candidate;
    }
  }
  return undefined;
}
