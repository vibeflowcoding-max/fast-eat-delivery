'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderService } from '@/services/order.service';
import { UserService } from '@/services/user.service';
import type { OrderWithDetails } from '@/schemas/order.schema';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/delivery/BottomNav';
import { Sidebar } from '@/components/delivery/Sidebar';
import { LottieAnimation } from '@/components/ui/lottie-animation';

export default function ActiveOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            const currentUser = await UserService.getCurrentUser();
            if (!currentUser) return;

            channel = OrderService.subscribeToMyOrders(currentUser.id, (payload) => {
                if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                    // Update the list if an order changes or is removed
                    loadActiveOrders();
                }
            });
        };

        loadActiveOrders();
        setupRealtime();

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, []);

    const loadActiveOrders = async () => {
        try {
            setIsLoading(true);
            const currentUser = await UserService.getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            const data = await OrderService.getActiveOrders(currentUser.id);
            setOrders(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar órdenes activas');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando órdenes activas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 min-h-screen pb-20 md:pb-0 bg-brand-background">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex justify-between items-center">
                            <h1 className="font-heading text-2xl font-bold text-brand-text">
                                Órdenes en Proceso
                            </h1>
                            <Button variant="outline" onClick={() => router.push('/orders')} className="md:hidden">
                                Ver Nuevas
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[16px] text-red-600">
                            {error}
                        </div>
                    )}

                    {orders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100 shadow-sm mx-auto max-w-sm">
                            <LottieAnimation
                                url="https://lottie.host/6b403d7c-8975-472e-8a2b-f975440266f8/O1W8f8lMvY.json"
                                className="w-56 h-56 mx-auto mb-4"
                            />
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">
                                No tienes órdenes en proceso
                            </h3>
                            <p className="text-gray-500 px-6">
                                Ve a la pestaña de "Inicio" para aceptar nuevas entregas.
                            </p>
                            <Button
                                variant="primary"
                                className="mt-8 px-8"
                                onClick={() => router.push('/orders')}
                            >
                                Ver órdenes disponibles
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {orders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/orders/${order.id}`}
                                    className="block"
                                >
                                    <div className="bg-white rounded-[16px] border border-orange-200 p-6 hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 -mr-12 -mt-12 rounded-full opacity-50"></div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h3 className="font-heading text-lg font-bold text-brand-text">
                                                    Orden #{order.order_number}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {new Date(order.created_at || '').toLocaleTimeString('es-CR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 animate-pulse">
                                                En Entrega
                                            </span>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Restaurante</p>
                                                <p className="font-bold text-brand-text">{order.restaurant.name}</p>
                                                <p className="text-sm text-gray-600 truncate">{order.restaurant.address}</p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Cliente</p>
                                                <p className="font-bold text-brand-text">{order.customer.name}</p>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {order.delivery_address?.replace(/\\n/g, ' ').replace(/(https?:\/\/[^\s]+)/gi, '').trim() || 'Sin dirección'}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                                                    <span className="text-xs font-bold text-brand-primary">Ir a detalles</span>
                                                </div>
                                                <span className="text-sm text-brand-primary font-bold">
                                                    Ver →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Bottom Navigation (Mobile) */}
            <BottomNav />
        </div>
    );
}
