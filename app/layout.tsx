import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { OptionalGoogleOAuthProvider } from '@/components/providers/google-oauth-provider'
import { PersianFontLinks } from '@/components/providers/persian-font-links'
import { I18nProvider } from '@/lib/i18n/context'
import { PersianFontProvider } from '@/lib/persian-font-context'
import { getDefaultPersianFontId, isPersianFontPreviewEnabled } from '@/lib/persian-font'

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono"
});

const defaultPersianFont = getDefaultPersianFontId();
const persianFontPreviewEnabled = isPersianFontPreviewEnabled();

export const metadata: Metadata = {
  title: 'HealthGuidelineEdge - Clinical Decision Support',
  description: 'Clinical decision support assistant for healthcare professionals with guideline-grounded, source-cited answers.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1b2e' },
  ],
  width: 'device-width',
  initialScale: 1,
}

const bootstrapScript = `
(() => {
  const root = document.documentElement;
  try {
    const themeKey = 'health-guideline-edge-theme';
    const storedTheme = window.localStorage.getItem(themeKey);
    const theme = storedTheme === 'light' ? 'light' : 'dark';
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch (_error) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }
  try {
    const localeKey = 'health-guideline-edge-locale';
    const storedLocale = window.localStorage.getItem(localeKey);
    const locale = storedLocale === 'fa' ? 'fa' : 'en';
    root.lang = locale;
    root.dir = locale === 'fa' ? 'rtl' : 'ltr';
    root.dataset.locale = locale;
  } catch (_error) {
    root.lang = 'en';
    root.dir = 'ltr';
    root.dataset.locale = 'en';
  }
  try {
    const previewEnabled = ${persianFontPreviewEnabled ? 'true' : 'false'};
    const defaultFont = ${JSON.stringify(defaultPersianFont)};
    const previewKey = 'health-guideline-edge-persian-font-preview';
    const storedFont = window.localStorage.getItem(previewKey);
    const allowed = new Set(['vazirmatn','iransansx','estedad','yekan-bakh','shabnam','sahel']);
    const font = previewEnabled && storedFont && allowed.has(storedFont) ? storedFont : defaultFont;
    root.dataset.persianFont = font;
  } catch (_error) {
    root.dataset.persianFont = ${JSON.stringify(defaultPersianFont)};
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <head>
        <PersianFontLinks />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <script
          dangerouslySetInnerHTML={{ __html: bootstrapScript }}
        />
        <PersianFontProvider>
          <I18nProvider>
            <OptionalGoogleOAuthProvider>{children}</OptionalGoogleOAuthProvider>
          </I18nProvider>
        </PersianFontProvider>
      </body>
    </html>
  )
}
