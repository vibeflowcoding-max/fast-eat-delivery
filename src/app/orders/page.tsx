'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { OrderService } from '@/services/order.service';
import { UserService } from '@/services/user.service';
import type { OrderWithDetails } from '@/schemas/order.schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/delivery/BottomNav';
import { Sidebar } from '@/components/delivery/Sidebar';
import { LottieAnimation } from '@/components/ui/lottie-animation';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOrders();

        // Subscribe to real-time updates
        const channel = OrderService.subscribeToReadyOrders((payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const status = payload.new.status_id;
                // If it's Preparing (3) or Ready (4), we want it in the list
                if (status === 3 || status === 4) {
                    loadOrders();
                } else {
                    // Otherwise, remove it (e.g., status changed to 5, 9, etc.)
                    setOrders((prev) => prev.filter((o) => o.id !== payload.new.id));
                }
            } else if (payload.eventType === 'DELETE') {
                setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const data = await OrderService.getReadyDeliveryOrders();
            setOrders(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar órdenes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await UserService.signOut();
            router.push('/login');
        } catch (err) {
            console.error('Error signing out:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando órdenes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 min-h-screen pb-20 md:pb-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex justify-between items-center">
                            <h1 className="font-heading text-2xl font-bold text-brand-text">
                                Órdenes Disponibles
                            </h1>
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="md:hidden text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Salir</span>
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
                        <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                            <LottieAnimation
                                url="https://lottie.host/804d9c4c-2a6c-48b4-9c02-4d2c88f9a234/uYgR7f1lXv.json"
                                className="w-64 h-64 mx-auto mb-4"
                            />
                            <h3 className="font-heading text-xl font-bold text-brand-text mb-2">
                                No hay órdenes disponibles
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Estamos buscando nuevos pedidos para ti. Mantén esta pantalla abierta para recibir actualizaciones en tiempo real.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {orders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/orders/${order.id}`}
                                    className="block"
                                >
                                    <div className="bg-white rounded-[16px] border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                        <div className="flex justify-between items-start mb-4">
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
                                            <span className={cn(
                                                "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
                                                order.status_id === 4
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-orange-100 text-orange-700"
                                            )}>
                                                {order.status_id === 4 ? 'Listo' : 'Preparando'}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Restaurante</p>
                                                <p className="font-medium text-brand-text">{order.restaurant.name}</p>
                                                <p className="text-sm text-gray-600">{order.restaurant.address}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                                                <p className="font-medium text-brand-text">{order.customer.name}</p>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {order.delivery_address?.replace(/\\n/g, ' ').replace(/(https?:\/\/[^\s]+)/gi, '').trim() || 'Sin dirección'}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 flex justify-end items-center">
                                                <span className="text-sm text-brand-primary font-medium">
                                                    Ver detalles →
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
