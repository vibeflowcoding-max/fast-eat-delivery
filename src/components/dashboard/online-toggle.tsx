'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toggleOnline } from '@/actions/driver.actions';
import { useRouter } from 'next/navigation';

interface OnlineToggleProps {
    userId: string;
    isOnline: boolean;
}

export function OnlineToggle({ userId, isOnline }: OnlineToggleProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = () => {
        startTransition(async () => {
            try {
                await toggleOnline(userId);
                // The revalidatePath in the server action will refresh the data,
                // but router.refresh() ensures the client side is also in sync.
                router.refresh();
            } catch (error) {
                console.error('Failed to toggle status:', error);
            }
        });
    };

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
                Estado: {isPending ? '⏳' : (isOnline ? '🟢 Online' : '🔴 Offline')}
            </span>
            <Button
                variant={isOnline ? "destructive" : "default"}
                size="sm"
                onClick={handleToggle}
                disabled={isPending}
                className="min-w-[100px]"
            >
                {isPending ? 'Cambiando...' : (isOnline ? 'Go Offline' : 'Go Online')}
            </Button>
        </div>
    );
}
