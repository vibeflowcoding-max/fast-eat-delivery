import type { Metadata } from 'next'
import { fontSans, fontHeading, fontBody } from '@/lib/fonts'
import './globals.css'
import { cn } from '@/lib/utils'
import { PWAInstallPrompt } from '@/components/delivery/PWAInstallPrompt'
import { NotificationHandler } from '@/components/delivery/NotificationHandler'

export const metadata: Metadata = {
  title: 'FastEat Delivery',
  description: 'Panel de repartidor para FastEat. Gestiona tus entregas en tiempo real.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FastEat',
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
        <NotificationHandler />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
