'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        console.log('[PWA] Component mounted');

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        console.log('[PWA] Is standalone:', isStandalone);

        if (isStandalone) {
            console.log('[PWA] App already installed, not showing prompt');
            return; // Already installed, don't show prompt
        }

        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        console.log('[PWA] Previously dismissed:', dismissed);

        if (dismissed) {
            console.log('[PWA] User dismissed before, not showing prompt');
            return;
        }

        const handler = (e: Event) => {
            console.log('[PWA] beforeinstallprompt event fired!');
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after 3 seconds
            setTimeout(() => {
                console.log('[PWA] Showing install prompt');
                setShowPrompt(true);
            }, 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        console.log('[PWA] Event listener added');

        // For testing: show prompt after 5 seconds even without the event
        const testTimeout = setTimeout(() => {
            console.log('[PWA] Test timeout - checking if prompt should show');
            if (!isStandalone && !dismissed) {
                console.log('[PWA] Showing test prompt (no beforeinstallprompt event)');
                setShowPrompt(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(testTimeout);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            console.log('[PWA] No deferred prompt available - showing manual instructions');
            // Don't hide the prompt, just update the message
            return;
        }

        console.log('[PWA] Triggering install prompt');
        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[PWA] User choice:', outcome);

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        } catch (error) {
            console.error('[PWA] Error during installation:', error);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showPrompt) {
        return null;
    }

    console.log('[PWA] Rendering prompt, deferredPrompt:', !!deferredPrompt);

    return (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-white rounded-[16px] shadow-2xl border-2 border-brand-primary p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand-primary rounded-[12px] flex items-center justify-center text-2xl">
                        📱
                    </div>
                    <div className="flex-1">
                        <h3 className="font-heading font-bold text-brand-text text-lg mb-2">
                            ¡Instala la App!
                        </h3>
                        <p className="text-sm text-brand-text opacity-80 mb-4">
                            Instala nuestra app para una mejor experiencia:
                        </p>
                        <ul className="text-sm text-brand-text opacity-80 space-y-1 mb-4">
                            <li>✓ Acceso rápido desde tu pantalla de inicio</li>
                            <li>✓ Funciona sin conexión</li>
                            <li>✓ Notificaciones de nuevas órdenes</li>
                            <li>✓ Experiencia más rápida y fluida</li>
                        </ul>

                        {!deferredPrompt && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                                <p className="font-semibold mb-2">Cómo instalar:</p>
                                <p className="mb-1">• <strong>Chrome/Edge:</strong> Menú (⋮) → "Instalar app"</p>
                                <p>• <strong>Safari iOS:</strong> Compartir → "Agregar a inicio"</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {deferredPrompt ? (
                                <>
                                    <Button
                                        onClick={handleInstall}
                                        className="flex-1"
                                        size="sm"
                                    >
                                        Instalar Ahora
                                    </Button>
                                    <Button
                                        onClick={handleDismiss}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Ahora no
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={handleDismiss}
                                    variant="outline"
                                    className="flex-1"
                                    size="sm"
                                >
                                    Entendido
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
