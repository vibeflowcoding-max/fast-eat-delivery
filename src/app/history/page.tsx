'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserService } from '@/services/user.service';
import { StatsService } from '@/services/stats.service';
import { DeliveryCard } from '@/components/delivery/DeliveryCard';
import { Button } from '@/components/ui/button';
import { startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import { BottomNav } from '@/components/delivery/BottomNav';
import { Sidebar } from '@/components/delivery/Sidebar';
import { LottieAnimation } from '@/components/ui/lottie-animation';

type FilterType = 'all' | 'today' | 'week' | 'month';

export default function HistoryPage() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        loadDeliveries();
    }, [filter]);

    const loadDeliveries = async () => {
        try {
            setIsLoading(true);
            const currentUser = await UserService.getCurrentUser();

            if (!currentUser) {
                router.push('/login');
                return;
            }

            let filters: any = {};

            switch (filter) {
                case 'today':
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    filters.startDate = startOfToday;
                    filters.endDate = endOfDay(new Date());
                    break;
                case 'week':
                    filters.startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
                    filters.endDate = endOfDay(new Date());
                    break;
                case 'month':
                    filters.startDate = startOfMonth(new Date());
                    filters.endDate = endOfDay(new Date());
                    break;
            }

            const history = await StatsService.getDeliveryHistory(
                currentUser.id,
                filters
            );
            setDeliveries(history || []);
        } catch (error) {
            console.error('Error loading deliveries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalEarnings = deliveries.reduce(
        (sum, delivery) => sum + (delivery.delivery_fee || 0),
        0
    );

    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 min-h-screen bg-brand-background pb-20 md:pb-0">
                {/* Header */}
                <div className="bg-white border-b border-brand-accent sticky top-0 z-10">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-heading font-bold text-brand-text">
                                Historial de Entregas
                            </h1>
                            <Button variant="ghost" onClick={() => router.push('/orders')} className="md:hidden">
                                Volver
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                Todas
                            </Button>
                            <Button
                                variant={filter === 'today' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('today')}
                            >
                                Hoy
                            </Button>
                            <Button
                                variant={filter === 'week' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('week')}
                            >
                                Esta Semana
                            </Button>
                            <Button
                                variant={filter === 'month' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('month')}
                            >
                                Este Mes
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6 max-w-4xl">
                    {/* Summary */}
                    <div className="bg-white rounded-[16px] p-6 mb-6 border border-brand-accent">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-brand-text opacity-60 mb-1">
                                    Total de Entregas
                                </p>
                                <p className="text-3xl font-heading font-bold text-brand-text">
                                    {deliveries.length}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-brand-text opacity-60 mb-1">
                                    Ganancias Totales
                                </p>
                                <p className="text-3xl font-heading font-bold text-brand-text">
                                    ₡{totalEarnings.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Deliveries List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                        </div>
                    ) : deliveries.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100 shadow-sm mx-auto max-w-sm">
                            <LottieAnimation
                                url="https://lottie.host/5dd021e5-8208-466d-9781-678971f66d48/A71lW7tC7v.json"
                                className="w-48 h-48 mx-auto mb-4"
                            />
                            <h3 className="text-xl font-heading font-bold text-brand-text mb-2">
                                No hay entregas
                            </h3>
                            <p className="text-brand-text opacity-60 px-6">
                                {filter === 'all'
                                    ? 'Aún no has completado ninguna entrega'
                                    : 'No hay entregas en este período'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deliveries.map((delivery) => (
                                <DeliveryCard
                                    key={delivery.id}
                                    orderNumber={delivery.order_number || delivery.id}
                                    restaurantName={delivery.restaurant?.name || 'Restaurante'}
                                    deliveryAddress={delivery.delivery_address || 'Sin dirección'}
                                    total={delivery.total || 0}
                                    status={delivery.status?.status || 'Completado'}
                                    createdAt={delivery.created_at}
                                    completedAt={delivery.updated_at}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
