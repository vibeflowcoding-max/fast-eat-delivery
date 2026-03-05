import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every
 * web page during static rendering.
 * The contents of this function only run in Node.js environments and
 * do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="es">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

                {/* 
          Disable body scrolling on web. This makes ScrollView components work as expected
          and prevents users from accidentally scrolling the page, which can be confusing 
          if you have full-screen layouts.
        */}
                <ScrollViewStyleReset />

                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#FF6B35" />

                <script dangerouslySetInnerHTML={{
                    __html: `
          window.addEventListener('beforeinstallprompt', (e) => {
            console.log('Capture early: beforeinstallprompt');
            e.preventDefault();
            window.deferredPrompt = e;
          });
        ` }} />

                {/* Add any additional <head> elements that you want globally available on web... */}
            </head>
            <body>{children}</body>
        </html>
    );
}
