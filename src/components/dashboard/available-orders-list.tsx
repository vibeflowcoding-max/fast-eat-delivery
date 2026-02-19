'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderService } from '@/services/order.service';
import { Badge } from '@/components/ui/badge';
import type { OrderWithDetails } from '@/schemas/order.schema';

interface AvailableOrdersListProps {
    userId: string;
}

export function AvailableOrdersList({ userId }: AvailableOrdersListProps) {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        loadOrders();

        // Subscribe to real-time updates
        const channel = OrderService.subscribeToReadyOrders((payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const status = payload.new.status_id;
                // Only Auction Active (7)
                // Orders stay visible during auction (InDrive model)
                if (status === 7) {
                    loadOrders();
                } else {
                    // Remove if status changes to something else (e.g., assigned, delivered)
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

    if (isLoading && orders.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando órdenes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
                <p>{error}</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-[16px] border border-brand-accent">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-heading font-bold text-brand-text mb-2">
                    No hay órdenes disponibles en este momento
                </h3>
                <p className="text-brand-text opacity-60 mb-4">
                    Las nuevas órdenes aparecerán aquí automáticamente.
                </p>
                <p className="text-sm text-brand-text opacity-50">
                    💡 Tip: Asegúrate de estar "Online" para recibir notificaciones
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
                <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="block"
                >
                    <div className="bg-white rounded-[16px] border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-heading text-lg font-bold text-brand-text">
                                    {order.restaurant?.name || 'Restaurante'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {order.restaurant?.address || 'Dirección no disponible'}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                {order.status_id === 3 && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                        ⏱️ Preparando
                                    </Badge>
                                )}
                                {order.status_id === 4 && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                                        ✅ Lista
                                    </Badge>
                                )}
                                {order.status_id === 7 && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 animate-pulse">
                                        💰 En Subasta
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-2 mb-4">
                            <div>
                                <span className="font-semibold text-sm">Cliente:</span>{' '}
                                <span className="text-sm">{order.customer.name}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-sm">Destino:</span>{' '}
                                <span className="text-sm">{order.customer.address || 'Dirección no disponible'}</span>
                            </div>
                        </div>

                        {/* Order Time */}
                        <div className="text-xs text-gray-500">
                            {isMounted ? new Date(order.created_at || '').toLocaleTimeString('es-CR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            }) : '--:--'}
                        </div>

                        {/* Ver detalles link */}
                        <div className="mt-4 text-brand-primary text-sm font-semibold flex items-center gap-1">
                            Ver detalles
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
