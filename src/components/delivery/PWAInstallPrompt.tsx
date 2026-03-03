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

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const triggerHandler = () => {
            localStorage.removeItem('pwa-install-dismissed');
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('trigger-pwa-install', triggerHandler);

        // Check standalone status
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const dismissed = localStorage.getItem('pwa-install-dismissed');

        // Show prompt after 5 seconds if not standalone and not dismissed
        const timer = setTimeout(() => {
            if (!isStandalone && !dismissed) {
                setShowPrompt(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('trigger-pwa-install', triggerHandler);
            clearTimeout(timer);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            return;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
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

    return (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-white rounded-[16px] shadow-2xl border-2 border-brand-primary p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand-primary rounded-[12px] flex items-center justify-center text-2xl">
                        📱
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-heading font-bold text-brand-text text-lg">
                                ¡Instala FastEat!
                            </h3>
                            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <p className="text-sm text-brand-text opacity-80 mb-4">
                            Instala la app para recibir notificaciones y trabajar mejor:
                        </p>
                        <ul className="text-xs text-brand-text opacity-70 space-y-1 mb-4">
                            <li>🎯 Notificaciones instantáneas de órdenes</li>
                            <li>🔊 Alertas sonoras (estilo Uber Eats)</li>
                            <li>🚀 Acceso más rápido y fluido</li>
                        </ul>

                        {!deferredPrompt && (
                            <div className="mb-4 p-3 bg-brand-primary/5 rounded-xl text-xs text-brand-text/80 border border-brand-primary/10">
                                <p className="font-bold mb-2">Instrucciones Manuales:</p>
                                <div className="space-y-2">
                                    <p>• <strong>Android (Chrome):</strong> Menú (⋮) → "Instalar aplicación"</p>
                                    <p>• <strong>iPhone (Safari):</strong> Compartir (⎋) → "Agregar a inicio"</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {deferredPrompt ? (
                                <Button onClick={handleInstall} className="flex-1 font-bold h-11 rounded-xl">
                                    Instalar Ahora
                                </Button>
                            ) : (
                                <Button onClick={handleDismiss} className="flex-1 font-bold h-11 rounded-xl">
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
