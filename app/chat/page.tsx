'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { HealthChatbotApp } from '@/components/health-chatbot/health-chatbot-app';
import { getAuthStatus } from '@/lib/api-client';
import type { AuthUser } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';

export default function ChatPage() {
  const { t } = useI18n();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const status = await getAuthStatus();
        if (cancelled) {
          return;
        }
        setCurrentUser(status.authenticated && status.user ? status.user : null);
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('chat.loadingWorkspace')}
        </div>
      </div>
    );
  }

  return <HealthChatbotApp currentUser={currentUser} />;
}
