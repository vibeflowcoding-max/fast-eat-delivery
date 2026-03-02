'use client';

import { useDriverStatus } from '@/context/driver-status.context';
import { cn } from '@/lib/utils';

export function OnlineToggle() {
    const { isOnline, isPending, handleToggle } = useDriverStatus();

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            aria-label={isOnline ? 'Ir a modo offline' : 'Ir a modo online'}
            className={cn(
                'relative flex items-center gap-2.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-300 select-none',
                'border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isPending && 'opacity-60 cursor-not-allowed',
                isOnline
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-400'
                    : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 focus-visible:ring-gray-400'
            )}
        >
            {/* Animated indicator dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
                {isOnline && !isPending && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                    className={cn(
                        'relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-300',
                        isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                    )}
                />
            </span>

            {/* Label */}
            <span className="leading-none">
                {isPending ? 'Cambiando...' : isOnline ? 'En línea' : 'Offline'}
            </span>

            {/* Pill track for a toggle feel */}
            <span
                className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ml-0.5',
                    isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                )}
            >
                <span
                    className={cn(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300',
                        isOnline ? 'translate-x-4' : 'translate-x-1'
                    )}
                />
            </span>
        </button>
    );
}
