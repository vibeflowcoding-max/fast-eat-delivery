import React, { useEffect, useState } from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

export const Toaster = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return <SonnerToaster position="top-center" richColors />;
};

export const showToast = (title: string, message: string, onPress: () => void) => {
    sonnerToast(title, {
        description: message,
        action: {
            label: 'Ver Detalles',
            onClick: onPress,
        }
    });
};
