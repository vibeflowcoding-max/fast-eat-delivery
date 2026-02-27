import * as burnt from 'burnt';

export const Toaster = () => null; // Native does not need a global Provider component for burnt

export const showToast = (title: string, message: string, onPress: () => void) => {
    burnt.toast({
        title,
        message,
        preset: 'done',
        duration: 5,
    });
};
