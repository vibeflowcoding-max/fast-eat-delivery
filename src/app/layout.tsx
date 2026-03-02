import type { Metadata } from 'next'
import { fontSans, fontHeading, fontBody } from '@/lib/fonts'
import './globals.css'
import { cn } from '@/lib/utils'
import { PWAInstallPrompt } from '@/components/delivery/PWAInstallPrompt'
import { useOrderNotifications } from '@/hooks/use-order-notifications'

export const metadata: Metadata = {
  title: 'Delivery App',
  description: 'Subscription-based delivery app for drivers.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Delivery App',
  },
}

export const viewport = {
  themeColor: '#FF6B35',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use custom hook for order notifications
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOrderNotifications();
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[SW] Registration successful:', registration.scope);
                    },
                    function(err) {
                      console.log('[SW] Registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-brand-background font-body antialiased",
          fontSans.variable,
          fontHeading.variable,
          fontBody.variable
        )}
      >
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
