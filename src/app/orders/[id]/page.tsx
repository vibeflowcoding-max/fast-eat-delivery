'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { OrderService } from '@/services/order.service';
import { UserService } from '@/services/user.service';
import type { OrderWithDetails } from '@/schemas/order.schema';
import { Button } from '@/components/ui/button';

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const channel = OrderService.subscribeToSingleOrder(orderId, (payload) => {
            if (payload.eventType === 'UPDATE') {
                // If status changed, refresh data
                loadOrder();
            }
        });

        loadOrder();
        loadCurrentUser();

        return () => {
            channel.unsubscribe();
        };
    }, [orderId]);

    const loadCurrentUser = async () => {
        try {
            const user = await UserService.getCurrentUser();
            setCurrentUserId(user?.id || null);
        } catch (err) {
            console.error('Error loading user:', err);
        }
    };

    const loadOrder = async () => {
        try {
            setIsLoading(true);
            const data = await OrderService.getOrderById(orderId);
            setOrder(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar orden');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartDelivery = async () => {
        if (!order || !currentUserId) return;

        try {
            setIsUpdating(true);
            await OrderService.updateOrderStatus(order.id, {
                status_id: 5, // Out for Delivery
                delivery_id: currentUserId,
            });
            // Refresh order instead of redirecting so user sees the security code
            loadOrder();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar orden');
        } finally {
            setIsUpdating(false);
        }
    };

    const renderAddress = (address: string | null) => {
        if (!address) return null;

        // Regex to find Google Maps URLs (lat/lng or direct links)
        const urlRegex = /(https?:\/\/[^\s]+maps[^\s]+|https?:\/\/goo\.gl\/maps\/[^\s]+)/gi;
        const parts = address.split(urlRegex);

        return (
            <div className="space-y-1">
                {parts.map((part, i) => {
                    if (part.match(urlRegex)) {
                        return (
                            <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-2 text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Abrir en Google Maps
                            </a>
                        );
                    }
                    // Clean up \n\n and other artifacts from the text
                    const cleanPart = part.replace(/\\n/g, '\n').trim();
                    return cleanPart ? <p key={i} className="text-gray-600 whitespace-pre-line">{cleanPart}</p> : null;
                })}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando detalles...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="font-heading text-2xl font-bold text-brand-text mb-2">
                        Orden no encontrada
                    </h2>
                    <Link href="/orders">
                        <Button variant="primary">Volver a órdenes</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-background pb-24">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/orders">
                            <Button variant="ghost" size="icon">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Button>
                        </Link>
                        <h1 className="font-heading text-2xl font-bold text-brand-text">
                            Orden #{order.order_number}
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[16px] text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Security Code - Only show when Out for Delivery (status_id >= 5) */}
                    {order.status_id >= 5 && order.security_code && (
                        <div className="bg-white rounded-[16px] border-2 border-brand-primary p-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-md shadow-brand-primary/10">
                            <p className="text-sm text-gray-600 mb-2 font-medium">Código de Verificación</p>
                            <p className="font-heading text-5xl font-bold text-brand-primary text-center tracking-widest py-2">
                                {order.security_code}
                            </p>
                            <p className="text-xs text-gray-500 text-center mt-3 bg-gray-50 py-2 rounded-lg border border-gray-100">
                                Solicita este código al cliente para completar la entrega
                            </p>
                        </div>
                    )}

                    {/* Restaurant Info */}
                    <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="font-heading text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                            Recoger en
                        </h2>
                        <div className="space-y-3">
                            <p className="font-bold text-brand-text text-lg">{order.restaurant.name}</p>
                            <p className="text-gray-600 leading-relaxed">{order.restaurant.address}</p>
                            {order.restaurant.phone && (
                                <a
                                    href={`tel:${order.restaurant.phone}`}
                                    className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-medium border border-gray-100"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Llamar: {order.restaurant.phone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="font-heading text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            Entregar a
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="font-bold text-brand-text text-lg">{order.customer.name}</p>
                                <div className="mt-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl leading-relaxed">
                                    {renderAddress(order.delivery_address)}
                                </div>
                            </div>
                            {order.customer.phone && (
                                <a
                                    href={`tel:${order.customer.phone}`}
                                    className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-medium border border-gray-100"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Llamar: {order.customer.phone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Order Items - Replaces Price Info */}
                    <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm">
                        <h2 className="font-heading text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-400 rounded-full"></span>
                            Detalles del Pedido
                        </h2>
                        <div className="divide-y divide-gray-100">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item) => (
                                    <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-brand-primary/10 text-brand-primary rounded-xl font-bold text-lg">
                                                    {item.quantity}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-brand-text text-lg">{item.name}</p>
                                                    {item.special_instructions && (
                                                        <div className="mt-2 flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded-lg border border-orange-100 italic">
                                                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                            </svg>
                                                            {item.special_instructions}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 py-4 italic">No hay platillos detallados</p>
                            )}
                        </div>

                        {order.notes && (
                            <div className="mt-6 space-y-4 pt-4 border-t border-gray-100">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 mb-2">Instrucciones Especiales</p>
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-600 text-sm border border-gray-100 leading-relaxed">
                                        {order.notes}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button - Show for status 3 (disabled) and status 4 (enabled) */}
                    {(order.status_id === 3 || order.status_id === 4) && (
                        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                            <div className="max-w-3xl mx-auto">
                                {order.status_id === 3 ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2 text-orange-600 font-bold bg-orange-50 px-4 py-2 rounded-full border border-orange-100 animate-pulse">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            Restaurante preparando pedido...
                                        </div>
                                        <Button
                                            variant="secondary"
                                            className="w-full h-16 text-lg font-bold opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                            disabled={true}
                                        >
                                            Esperando preparación
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="primary"
                                        className="w-full h-16 text-lg font-bold shadow-xl shadow-brand-primary/30 active:scale-95 transition-transform"
                                        onClick={handleStartDelivery}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Procesando...
                                            </span>
                                        ) : (
                                            'Iniciar Entrega'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
