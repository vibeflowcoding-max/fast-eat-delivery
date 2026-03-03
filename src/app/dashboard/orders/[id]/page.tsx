'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { OrderService } from '@/services/order.service';
import { UserService } from '@/services/user.service';
import { AuctionService } from '@/services/auction.service';
import type { OrderWithDetails } from '@/schemas/order.schema';
import { Button } from '@/components/ui/button';
import { BiddingPanel } from '@/components/delivery/BiddingPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Map, Navigation } from "lucide-react";
import { useGeolocation } from '@/hooks/use-geolocation';
import { calculateDistanceKm, estimateETA } from '@/lib/utils/distance';

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    // Security code verification for completing delivery
    const [securityCode, setSecurityCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const [mapDialogData, setMapDialogData] = useState<{
        addressText: string;
        googleUrl?: string | null;
        lat?: number | null;
        lng?: number | null;
    }>({ addressText: '' });

    const { location } = useGeolocation();

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
            console.log('📦 Order loaded:', {
                id: data?.id,
                status_id: data?.status_id,
                delivery_base_price: data?.delivery_base_price,
                order_number: data?.order_number
            });
            setOrder(data);
        } catch (err) {
            console.error('❌ Error in loadOrder:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar orden');
        } finally {
            setIsLoading(false);
        }
    };

    const startAuction = async (orderData: OrderWithDetails) => {
        try {
            // For now, use a default distance of 3.5km
            // TODO: Calculate actual distance from driver location to customer address
            const distance = 3.5;

            console.log('💰 Calling AuctionService.startAuction with:', {
                orderId: orderData.id,
                distance
            });

            const result = await AuctionService.startAuction(orderData.id, distance);
            console.log('✅ Auction started, result:', result);

            // Refresh order to get updated auction data
            const updatedOrder = await OrderService.getOrderById(orderId);
            console.log('🔄 Order refreshed after auction start:', {
                status_id: updatedOrder?.status_id,
                delivery_base_price: updatedOrder?.delivery_base_price
            });
            setOrder(updatedOrder);
        } catch (err) {
            console.error('❌ Error starting auction:', err);
            setError('Error al iniciar subasta: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleStartDelivery = async () => {
        if (!order || !currentUserId) return;

        try {
            setIsUpdating(true);
            // Move from DRIVER_ASSIGNED (8) to DELIVERING (5)
            await OrderService.updateOrderStatus(order.id, {
                status_id: 5, // Delivering (Picked up)
                delivery_id: currentUserId,
            });
            // Refresh order
            loadOrder();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar orden');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCompleteDelivery = async () => {
        if (!order || !currentUserId || !isCodeVerified) return;

        try {
            setIsUpdating(true);
            // Move from DELIVERING (5) to COMPLETED (11)
            await OrderService.updateOrderStatus(order.id, {
                status_id: 11,
                delivery_id: currentUserId,
            });
            loadOrder();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al completar entrega');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCodeChange = (value: string) => {
        const upper = value.toUpperCase();
        setSecurityCode(upper);
        setCodeError('');
        if (upper.length > 0 && order?.security_code) {
            if (upper === order.security_code) {
                setIsCodeVerified(true);
                setCodeError('');
            } else {
                setIsCodeVerified(false);
                if (upper.length >= (order.security_code?.length ?? 4)) {
                    setCodeError('Código incorrecto. Solicita el código correcto al cliente.');
                }
            }
        } else {
            setIsCodeVerified(false);
        }
    };

    const openMapDialog = (addressText: string, googleUrl?: string | null, lat?: number | null, lng?: number | null) => {
        setMapDialogData({ addressText, googleUrl, lat, lng });
        setMapDialogOpen(true);
    };

    const launchGoogleMaps = () => {
        let uri = '';
        if (mapDialogData.googleUrl) {
            uri = mapDialogData.googleUrl;
        } else if (mapDialogData.lat && mapDialogData.lng) {
            uri = `https://www.google.com/maps/search/?api=1&query=${mapDialogData.lat},${mapDialogData.lng}`;
        } else {
            const cleanAddress = mapDialogData.addressText.trim();
            if (cleanAddress) {
                uri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
            } else {
                uri = 'https://www.google.com/maps';
            }
        }
        window.open(uri, '_blank', 'noopener,noreferrer');
        setMapDialogOpen(false);
    };

    const launchWaze = () => {
        let uri = '';
        if (mapDialogData.lat && mapDialogData.lng) {
            uri = `https://waze.com/ul?ll=${mapDialogData.lat},${mapDialogData.lng}&navigate=yes`;
        } else {
            const cleanAddress = mapDialogData.addressText.trim();
            if (cleanAddress) {
                uri = `https://waze.com/ul?q=${encodeURIComponent(cleanAddress)}`;
            } else {
                uri = 'https://waze.com/ul';
            }
        }
        window.open(uri, '_blank', 'noopener,noreferrer');
        setMapDialogOpen(false);
    };

    const renderAddress = (address: string | null, isCustomer = false) => {
        if (!address) return null;

        return (
            <div className="space-y-3">
                <p className="text-gray-600 whitespace-pre-line">{address.replace(/\\n/g, '\n').trim()}</p>
                {isCustomer && (order?.customer_latitude && order?.customer_longitude) && (
                    <Button
                        variant="outline"
                        onClick={() => openMapDialog(address, null, order.customer_latitude, order.customer_longitude)}
                        className="w-full h-12 rounded-2xl border-blue-200 bg-white text-blue-600 font-bold shadow-sm hover:bg-blue-50 transition-all gap-2"
                    >
                        <Navigation className="w-4 h-4" />
                        <span>Navegar al Cliente</span>
                    </Button>
                )}
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
                    <Link href="/dashboard/feed">
                        <Button variant="primary">Volver a órdenes</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const distToRest = location && order.restaurant?.latitude && order.restaurant?.longitude
        ? calculateDistanceKm(location.lat, location.lng, order.restaurant.latitude, order.restaurant.longitude)
        : null;
    const etaRest = distToRest ? estimateETA(distToRest) : null;

    const distToCust = order.restaurant?.latitude && order.restaurant?.longitude && order.customer_latitude && order.customer_longitude
        ? calculateDistanceKm(order.restaurant.latitude, order.restaurant.longitude, order.customer_latitude, order.customer_longitude)
        : null;
    const etaCust = distToCust ? estimateETA(distToCust) : null;

    return (
        <div className="min-h-screen bg-brand-background pb-24">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/feed">
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
                    {/* Security Code - Only show when Assigned (8), Delivering (5) or Completed (11) */}
                    {(order.status_id === 8 || order.status_id === 5 || order.status_id === 11) && order.security_code && (
                        <div className="bg-white rounded-[16px] border-2 border-brand-primary p-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-md shadow-brand-primary/10">
                            <p className="text-sm text-gray-600 mb-2 font-medium">Código de Verificación</p>
                            <p className="font-heading text-5xl font-bold text-brand-primary text-center tracking-widest py-2">
                                {order.security_code}
                            </p>
                            <p className="text-xs text-gray-500 text-center mt-3 bg-gray-50 py-2 rounded-lg border border-gray-100">
                                {order.status_id === 11 ? 'Pedido completado' : 'Solicita este código al cliente para completar la entrega'}
                            </p>
                        </div>
                    )}

                    {/* Restaurant Info */}
                    <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="font-heading text-lg font-bold text-brand-text mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                                Recoger en
                            </div>
                            {etaRest && (
                                <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 flex items-center gap-1.5">
                                    <span className="text-green-600 text-sm">🚗</span>
                                    <span className="text-xs font-bold text-green-700">Aprox: {etaRest} min</span>
                                </div>
                            )}
                        </h2>
                        <div className="space-y-3">
                            <p className="font-bold text-brand-text text-lg">{order.restaurant?.name || 'Nombre no disponible'}</p>
                            <div className="mt-2 p-4 bg-orange-50/50 border border-orange-100 rounded-xl leading-relaxed space-y-3">
                                {order.restaurant?.address && (
                                    <p className="text-gray-600 whitespace-pre-line">{order.restaurant.address}</p>
                                )}
                                {((order.restaurant?.google_maps_url) || (order.restaurant?.latitude && order.restaurant?.longitude)) && (
                                    <Button
                                        variant="outline"
                                        onClick={() => openMapDialog(
                                            order.restaurant?.address || order.restaurant?.name || '',
                                            order.restaurant?.google_maps_url,
                                            order.restaurant?.latitude,
                                            order.restaurant?.longitude
                                        )}
                                        className="w-full h-12 rounded-2xl border-brand-primary/20 bg-white text-brand-primary font-bold shadow-sm hover:bg-brand-primary/5 transition-all gap-2"
                                    >
                                        <Navigation className="w-4 h-4" />
                                        <span>Navegar al Restaurante</span>
                                    </Button>
                                )}
                            </div>
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
                        <h2 className="font-heading text-lg font-bold text-brand-text mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                Entregar a
                            </div>
                            {etaCust && (
                                <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                                    <span className="text-blue-600 text-sm">⏱️</span>
                                    <span className="text-xs font-bold text-blue-700">Aprox: {etaCust} min</span>
                                </div>
                            )}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="font-bold text-brand-text text-lg">{order.customer.name}</p>
                                <div className="mt-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl leading-relaxed">
                                    {renderAddress(order.delivery_address, true)}
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


                    {/* Bidding Panel - Show when order is Ready (4), Preparing (3), or in Auction (7) */}
                    {currentUserId && (order.status_id === 3 || order.status_id === 4 || order.status_id === 7) && (
                        <BiddingPanel
                            orderId={order.id}
                            driverId={currentUserId}
                            basePrice={order.delivery_base_price || AuctionService.calculateBasePrice(order.delivery_distance_km || 3.5)}
                            distance={order.delivery_distance_km || 3.5}
                            orderNumber={order.order_number}
                            restaurantName={order.restaurant?.name || 'Restaurante'}
                            customerAddress={order.delivery_address}
                            onBidAccepted={() => {
                                // Refresh order to show new status
                                loadOrder();
                            }}
                        />
                    )}

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

                    {/* Action Button - Show for status 8 (Assigned) to move to 5 (Delivering) */}
                    {(order.status_id === 8) && (
                        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                            <div className="max-w-3xl mx-auto">
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
                                        'Recoger Pedido (Iniciar Entrega)'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Status 5 (Delivering) - Security Code Input to complete delivery */}
                    {order.status_id === 5 && (
                        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
                            <div className="max-w-3xl mx-auto space-y-3">
                                <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                                    En camino — ingresa el código del cliente para finalizar
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={securityCode}
                                            onChange={(e) => handleCodeChange(e.target.value)}
                                            placeholder="Código del cliente"
                                            maxLength={8}
                                            className={`w-full px-4 py-3 border-2 rounded-xl text-center text-xl font-bold tracking-widest uppercase outline-none transition-all ${isCodeVerified
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : codeError
                                                        ? 'border-red-400 bg-red-50 text-red-700'
                                                        : 'border-gray-300 focus:border-brand-primary'
                                                }`}
                                        />
                                        {codeError && (
                                            <p className="text-xs text-red-500 mt-1 text-center">{codeError}</p>
                                        )}
                                        {isCodeVerified && (
                                            <p className="text-xs text-green-600 mt-1 text-center font-semibold">✓ Código correcto</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={handleCompleteDelivery}
                                        disabled={!isCodeVerified || isUpdating}
                                        className={`h-[52px] px-5 font-bold text-base whitespace-nowrap transition-all ${isCodeVerified
                                                ? 'shadow-lg shadow-brand-primary/30 scale-105'
                                                : 'opacity-50'
                                            }`}
                                    >
                                        {isUpdating ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            '✅ Finalizar'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show status 11 (Completed) message */}
                    {order.status_id === 11 && (
                        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                            <div className="max-w-3xl mx-auto">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full border border-green-100">
                                        ✅ Pedido Entregado
                                    </div>
                                    <Link href="/dashboard/feed" className="w-full">
                                        <Button variant="outline" className="w-full h-12">
                                            Volver al Inicio
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
                <DialogContent className="sm:max-w-md w-[95%] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle>Abrir ubicación con...</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={launchGoogleMaps}
                            className="flex items-center gap-4 p-4 rounded-xl border hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="bg-green-100 p-2 rounded-full">
                                <Map className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold">Google Maps</h4>
                                <p className="text-sm text-muted-foreground">Abrir usando Google Maps</p>
                            </div>
                        </button>

                        <button
                            onClick={launchWaze}
                            className="flex items-center gap-4 p-4 rounded-xl border hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Navigation className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold">Waze</h4>
                                <p className="text-sm text-muted-foreground">Buscar dirección o ruta en Waze</p>
                            </div>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
