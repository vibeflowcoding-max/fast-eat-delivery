import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderService } from '@/services/order.service';
import { Badge } from '@/components/ui/badge';
import type { OrderWithDetails } from '@/schemas/order.schema';
import { useGeolocation } from '@/hooks/use-geolocation';
import { calculateDistanceKm, estimateETA } from '@/lib/utils/distance';
import { Map, Navigation, Store, ChevronRight, Clock, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderAlertModal } from '@/components/delivery/OrderAlertModal';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import { useDriverStatus } from '@/context/driver-status.context';

interface AvailableOrdersListProps {
    userId: string;
}

export function AvailableOrdersList({ userId }: AvailableOrdersListProps) {
    const router = useRouter();
    const { location } = useGeolocation();
    const { newOrderAlert, setNewOrderAlert, clearBadge } = useOrderNotifications();
    const { isOnline, handleToggle, isPending } = useDriverStatus();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const [mapDialogData, setMapDialogData] = useState<{
        addressText: string;
        googleUrl?: string | null;
        lat?: number | null;
        lng?: number | null;
    }>({ addressText: '' });

    useEffect(() => {
        setIsMounted(true);

        if (!isOnline) {
            setIsLoading(false);
            setOrders([]);
            return;
        }

        loadOrders();
        clearBadge();

        console.log('[Realtime] Subscribing to ready-delivery-orders...');
        // Subscribe to real-time updates
        const channel = OrderService.subscribeToReadyOrders((payload) => {
            console.log('[Realtime] Message received:', payload.eventType, payload.new?.id);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const status = payload.new.status_id;
                // Only Auction Active (7)
                if (status === 7) {
                    console.log('[Realtime] New auction order, refreshing list');
                    loadOrders();
                } else {
                    // Remove if status changes to something else
                    setOrders((prev) => prev.filter((o) => o.id !== payload.new.id));
                }
            } else if (payload.eventType === 'DELETE') {
                setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
            }
        });

        // Fallback polling: refresh every 30 seconds in case realtime drops or is disabled
        const pollingInterval = setInterval(() => {
            console.log('[Realtime] Fallback polling refresh');
            loadOrders();
        }, 30000);

        // Refresh when window gets focus (PWA background to foreground)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[PWA] Visibility changed to visible, refreshing');
                loadOrders();
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', loadOrders);

        return () => {
            console.log('[Realtime] Unsubscribing');
            channel.unsubscribe();
            clearInterval(pollingInterval);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', loadOrders);
        };
    }, [isOnline]);

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

    const openMapDialog = (e: React.MouseEvent, addressText: string, googleUrl?: string | null, lat?: number | null, lng?: number | null) => {
        e.preventDefault();
        e.stopPropagation();
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

    if (isLoading && orders.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando órdenes...</p>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 px-6 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                    <WifiOff className="w-9 h-9 text-gray-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-brand-text mb-2">
                    Estás en modo Offline
                </h3>
                <p className="text-brand-text opacity-60 text-sm max-w-xs mb-6">
                    No estás recibiendo órdenes. Activa el modo Online para empezar a trabajar.
                </p>
                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-md shadow-emerald-500/30 disabled:opacity-60"
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    {isPending ? 'Cambiando...' : 'Ir a Online'}
                </button>
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
                    💡 Estás Online y listo para recibir pedidos
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {orders.map((order) => {
                const distToRest = location && order.restaurant?.latitude && order.restaurant?.longitude
                    ? calculateDistanceKm(location.lat, location.lng, order.restaurant.latitude, order.restaurant.longitude)
                    : null;
                const etaRest = distToRest ? estimateETA(distToRest) : null;

                const distToCust = order.restaurant?.latitude && order.restaurant?.longitude && order.customer_latitude && order.customer_longitude
                    ? calculateDistanceKm(order.restaurant.latitude, order.restaurant.longitude, order.customer_latitude, order.customer_longitude)
                    : null;
                const etaCust = distToCust ? estimateETA(distToCust) : null;

                return (
                    <div key={order.id} className="w-full">
                        <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="block w-full"
                        >
                            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                                {/* Header: Restaurant Name and Status */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Store className="w-4 h-4 text-brand-primary" />
                                            <h3 className="font-heading text-lg font-bold text-brand-text truncate">
                                                {order.restaurant?.name || 'Restaurante'}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-brand-text opacity-60 truncate">
                                            {order.restaurant?.address || 'Dirección no disponible'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end shrink-0">
                                        {order.status_id === 7 && (
                                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 rounded-full py-1 animate-pulse font-bold text-[10px] uppercase tracking-wider">
                                                💰 En Subasta
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="bg-brand-primary/5 text-brand-primary border-brand-primary/20 rounded-lg font-bold text-xs px-2 py-1">
                                            BASE: ₡{order.delivery_base_price?.toLocaleString() || '---'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Body: Distance and Navigation */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {/* Distance Info */}
                                    <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Navigation className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Dist. al Rest.</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-slate-800">{distToRest?.toFixed(1) || '?.?'}</span>
                                            <span className="text-[10px] font-bold text-slate-400">KM</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                            Lat: {order.restaurant?.latitude?.toString().slice(0, 8) || '---'}
                                        </div>
                                    </div>

                                    {/* Navigation Button */}
                                    <div className="flex flex-col justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => openMapDialog(e, order.restaurant?.address || '', order.restaurant?.google_maps_url, order.restaurant?.latitude, order.restaurant?.longitude)}
                                            className="w-full h-12 rounded-2xl border-brand-primary/20 bg-brand-primary/5 text-brand-primary text-[13px] font-bold gap-2 justify-center hover:bg-brand-primary/10 transition-colors shadow-sm"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Navegar
                                        </Button>
                                    </div>
                                </div>

                                {/* Footer: Customer and Timing */}
                                <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs">
                                            👤
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Cliente</p>
                                            <p className="text-xs font-bold text-slate-700 leading-none">{order.customer.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 mb-0.5">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span className="text-[11px] font-black text-slate-600">
                                                    {isMounted ? new Date(order.created_at || '').toLocaleTimeString('es-CR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }) : '--:--'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Hace {Math.floor((Date.now() - new Date(order.created_at || '').getTime()) / 60000)} min</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-brand-primary" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )
            })}

            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
                <DialogContent className="sm:max-w-md w-[95%] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-center font-heading font-bold text-xl">Abrir ubicación con...</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        <Button
                            variant="outline"
                            onClick={launchGoogleMaps}
                            className="flex items-center gap-4 p-6 h-auto rounded-2xl border-gray-100 hover:bg-slate-50 hover:border-gray-200 transition-all text-left justify-start"
                        >
                            <div className="bg-green-100 p-3 rounded-xl flex shrink-0">
                                <Map className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-800">Google Maps</h4>
                                <p className="text-xs text-slate-400 truncate">Ver detalles de la ruta y tráfico</p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={launchWaze}
                            className="flex items-center gap-4 p-6 h-auto rounded-2xl border-gray-100 hover:bg-slate-50 hover:border-gray-200 transition-all text-left justify-start"
                        >
                            <div className="bg-blue-100 p-3 rounded-xl flex shrink-0">
                                <Navigation className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-800">Waze Navigation</h4>
                                <p className="text-xs text-slate-400 truncate">Optimizado para ahorrar tiempo en ruta</p>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Uber Eats Style Alert Modal */}
            <OrderAlertModal
                order={newOrderAlert}
                onOpenDetails={(order) => {
                    setNewOrderAlert(null);
                    router.push(`/dashboard/orders/${order.id}`);
                }}
                onClose={() => setNewOrderAlert(null)}
            />
        </div>
    );
}
