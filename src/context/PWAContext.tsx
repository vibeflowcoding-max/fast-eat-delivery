import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface PWAContextType {
    deferredPrompt: any;
    installPWA: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const checkPrompt = () => {
                if ((window as any).deferredPrompt) {
                    setDeferredPrompt((window as any).deferredPrompt);
                }
            };

            // Check immediately if it was already captured by script in +html
            checkPrompt();

            const handler = (e: any) => {
                console.log('beforeinstallprompt captured in Context');
                e.preventDefault();
                setDeferredPrompt(e);
            };

            window.addEventListener('beforeinstallprompt', handler);

            // Periodically check if it appeared on window
            const interval = setInterval(checkPrompt, 1000);

            return () => {
                window.removeEventListener('beforeinstallprompt', handler);
                clearInterval(interval);
            };
        }
    }, []);

    const installPWA = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA install outcome: ${outcome}`);
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    return (
        <PWAContext.Provider value={{ deferredPrompt, installPWA }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}
