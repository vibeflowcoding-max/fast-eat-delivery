import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DeliveryCardProps {
    orderNumber: string;
    restaurantName: string;
    deliveryAddress: string;
    total: number;
    status: string;
    createdAt: string;
    completedAt?: string;
    onClick?: () => void;
}

export function DeliveryCard({
    orderNumber,
    restaurantName,
    deliveryAddress,
    total,
    status,
    createdAt,
    completedAt,
    onClick,
}: DeliveryCardProps) {
    const isCompleted = status === 'Completed';
    const date = new Date(createdAt);
    const formattedDate = format(date, "d 'de' MMMM, yyyy", { locale: es });
    const formattedTime = format(date, 'HH:mm');

    // Calculate delivery time if completed
    let deliveryTime: string | null = null;
    if (completedAt) {
        const start = new Date(createdAt);
        const end = new Date(completedAt);
        const diffMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
        deliveryTime = `${diffMinutes} min`;
    }

    return (
        <div
            className={cn(
                'bg-white rounded-[16px] p-4 border border-brand-accent cursor-pointer transition-all hover:shadow-md',
                onClick && 'hover:border-brand-primary'
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm font-medium text-brand-text opacity-60">
                        #{orderNumber}
                    </p>
                    <h3 className="font-heading font-bold text-brand-text text-lg">
                        {restaurantName}
                    </h3>
                </div>
                <span
                    className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    )}
                >
                    {status}
                </span>
            </div>

            <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                    <span className="text-brand-text opacity-60">📍</span>
                    <p className="text-sm text-brand-text opacity-80 flex-1">
                        {deliveryAddress}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-brand-text opacity-60">🕐</span>
                    <p className="text-sm text-brand-text opacity-80">
                        {formattedDate} a las {formattedTime}
                    </p>
                </div>
                {deliveryTime && (
                    <div className="flex items-center gap-2">
                        <span className="text-brand-text opacity-60">⏱️</span>
                        <p className="text-sm text-brand-text opacity-80">
                            Tiempo de entrega: {deliveryTime}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-brand-accent">
                <span className="text-sm text-brand-text opacity-60">Total</span>
                <span className="font-bold text-brand-text text-lg">
                    ₡{total.toLocaleString()}
                </span>
            </div>
        </div>
    );
}
