'use client';

import { OrderWithDetails } from "@/schemas/order.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { acceptOrder, completeOrder, verifyAndCompleteOrder } from "@/actions/order.actions";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Map, Navigation, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeolocation } from '@/hooks/use-geolocation';
import { calculateDistanceKm, estimateETA } from '@/lib/utils/distance';

interface OrderCardProps {
    order: OrderWithDetails;
    type: 'FEED' | 'ACTIVE';
    driverId: string;
}

export function OrderCard({ order, type, driverId }: OrderCardProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [mapDialogData, setMapDialogData] = useState<{
        addressText: string;
        googleUrl?: string | null;
        lat?: number | null;
        lng?: number | null;
    }>({ addressText: '' });

    const { location } = useGeolocation();

    const handleAccept = () => {
        startTransition(async () => {
            const res = await acceptOrder(order.id, driverId);
            if (res.success) {
                router.push('/dashboard/active-order');
            } else {
                alert('Error: ' + res.error);
            }
        });
    };

    const handleComplete = () => {
        setVerificationError(null);
        if (order.status_id === 5 && !verificationCode) {
            setVerificationError('Por favor ingresa el código de verificación.');
            return;
        }

        startTransition(async () => {
            let res;
            if (order.status_id === 5) {
                res = await verifyAndCompleteOrder(order.id, driverId, verificationCode);
            } else {
                res = await completeOrder(order.id, driverId);
            }

            if (res.success) {
                router.push('/dashboard/feed');
            } else {
                setVerificationError(res.error);
            }
        });
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

    const distToRest = location && order.restaurant?.latitude && order.restaurant?.longitude
        ? calculateDistanceKm(location.lat, location.lng, order.restaurant.latitude, order.restaurant.longitude)
        : null;
    const etaRest = distToRest ? estimateETA(distToRest) : null;

    const distToCust = order.restaurant?.latitude && order.restaurant?.longitude && order.customer_latitude && order.customer_longitude
        ? calculateDistanceKm(order.restaurant.latitude, order.restaurant.longitude, order.customer_latitude, order.customer_longitude)
        : null;
    const etaCust = distToCust ? estimateETA(distToCust) : null;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-heading font-black text-slate-800">{order.restaurant?.name || 'Orden'}</CardTitle>
                        <div className="flex flex-col gap-2 items-end shrink-0">
                            {order.status_id === 3 && (
                                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 rounded-full animate-pulse">
                                    ⏱️ Preparando
                                </Badge>
                            )}
                            {order.status_id === 4 && (
                                <Badge className="bg-green-50 text-green-700 border-green-200 rounded-full">
                                    ✅ Lista
                                </Badge>
                            )}
                            <Badge variant="outline" className={cn("bg-brand-primary/5 text-brand-primary border-brand-primary/20 rounded-lg font-black", type === 'ACTIVE' ? 'hidden' : '')}>
                                ₡{order.total.toLocaleString()}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        {order.restaurant?.address && <p>{order.restaurant.address}</p>}
                        {((order.restaurant?.google_maps_url) || (order.restaurant?.latitude && order.restaurant?.longitude)) && (
                            <button
                                onClick={() => openMapDialog(
                                    order.restaurant?.address || order.restaurant?.name || '',
                                    order.restaurant?.google_maps_url,
                                    order.restaurant?.latitude,
                                    order.restaurant?.longitude
                                )}
                                className="text-primary underline hover:text-primary/80 text-left font-bold"
                            >
                                Ver Ubicación 📍
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-4">
                        {/* Pickup Info */}
                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                            <div className="flex items-center gap-2 mb-2 justify-between">
                                <div className="flex items-center gap-2 text-orange-800 font-bold">
                                    <Store className="w-5 h-5" />
                                    <span>Recoger en:</span>
                                </div>
                                {etaRest && (
                                    <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 flex items-center gap-1.5">
                                        <span className="text-green-600 text-sm">🚗</span>
                                        <span className="text-xs font-bold text-green-700">Aprox: {etaRest} min</span>
                                    </div>
                                )}
                            </div>
                            <div className="ml-7 space-y-1">
                                <div>
                                    <span className="font-semibold">Customer:</span> {order.customer.name}
                                </div>
                                <div>
                                    <span className="font-semibold">Destination:</span>
                                    <div className="ml-1 inline">
                                        {(() => {
                                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                                            const address = order.customer.address || '';
                                            const parts = address.split(urlRegex);
                                            return parts.map((part, i) => {
                                                if (part.match(urlRegex)) {
                                                    const cleanAddress = address.replace(part, '').trim();
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => openMapDialog(
                                                                cleanAddress || address,
                                                                part,
                                                                order.customer_latitude,
                                                                order.customer_longitude
                                                            )}
                                                            className="text-primary underline hover:text-primary/80 break-all font-bold ml-1 inline-block"
                                                        >
                                                            Ubicación 📍
                                                        </button>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 justify-between">
                                <div className="flex items-center gap-2 text-blue-800 font-black">
                                    <div className="bg-blue-100 p-2 rounded-xl">
                                        <Navigation className="w-5 h-5" />
                                    </div>
                                    <span>Entregar a:</span>
                                </div>
                                {etaCust && (
                                    <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 flex items-center gap-1.5">
                                        <span className="text-green-600 text-sm">🚗</span>
                                        <span className="text-xs font-bold text-green-700">Aprox: {etaCust} min</span>
                                    </div>
                                )}
                            </div>
                            <div className="ml-0 space-y-3">
                                <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-blue-50">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">👤</div>
                                    <div>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase leading-none mb-1">Cliente</p>
                                        <p className="font-bold text-slate-700">{order.customer.name}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/50 rounded-xl border border-blue-50">
                                    <p className="text-[10px] text-blue-400 font-bold uppercase leading-none mb-2">Destino</p>
                                    <p className="text-sm text-slate-600 mb-3">{order.customer.address || 'Dirección no disponible'}</p>

                                    {order.customer_latitude && order.customer_longitude && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openMapDialog(order.customer.address || '', null, order.customer_latitude, order.customer_longitude)}
                                                className="flex-1 rounded-xl font-bold gap-2 text-xs"
                                            >
                                                <Map className="w-4 h-4 text-green-600" />
                                                Maps
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openMapDialog(order.customer.address || '', null, order.customer_latitude, order.customer_longitude)}
                                                className="flex-1 rounded-xl font-bold gap-2 text-xs"
                                            >
                                                <Navigation className="w-4 h-4 text-blue-600" />
                                                Waze
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {order.items.map((item, i) => (
                            <div key={item.id || i} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                {type === 'FEED' && (
                                    <span className="text-muted-foreground">₡{item.subtotal.toLocaleString()}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    {type === 'ACTIVE' && order.status_id === 5 && (
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col gap-3 my-4">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Confirmación de Entrega</span>
                                <p className="text-sm text-center text-muted-foreground px-4">
                                    Solicita el código al cliente para finalizar el pedido.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Ingresa el código"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full h-14 text-center text-2xl font-black tracking-widest text-primary font-mono bg-white border-2 border-primary/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    maxLength={6}
                                />
                                {verificationError && (
                                    <p className="text-xs text-center text-destructive font-medium animate-pulse">
                                        ❌ {verificationError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {order.notes && (
                        <div className="bg-muted p-2 rounded text-sm italic">
                            " {order.notes} "
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {type === 'FEED' && (
                        <div className="w-full space-y-2">
                            <Button
                                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                onClick={handleAccept}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    '⏳ Aceptando...'
                                ) : (
                                    <>
                                        🚴 TOMAR ORDEN - ₡{order.delivery_fee?.toLocaleString() || '2,500'}
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Haz clic para aceptar esta orden
                            </p>
                        </div>
                    )}
                    {type === 'ACTIVE' && (
                        <Button
                            className="w-full h-12 text-lg font-bold"
                            variant="default"
                            onClick={handleComplete}
                            disabled={isPending || (order.status_id === 5 && !verificationCode)}
                        >
                            {isPending ? '⏳ Completando...' : '✅ FINALIZAR ENTREGA'}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
                <DialogContent className="sm:max-w-md">
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
        </>
    );
}
