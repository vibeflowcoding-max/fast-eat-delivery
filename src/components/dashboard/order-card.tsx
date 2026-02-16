'use client';

import { OrderWithDetails } from "@/schemas/order.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { acceptOrder, completeOrder } from "@/actions/order.actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface OrderCardProps {
    order: OrderWithDetails;
    type: 'FEED' | 'ACTIVE';
    driverId: string;
}

export function OrderCard({ order, type, driverId }: OrderCardProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

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
        startTransition(async () => {
            const res = await completeOrder(order.id, driverId);
            if (res.success) {
                router.push('/dashboard/feed');
            } else {
                alert('Error: ' + res.error);
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{order.restaurant?.name || 'Orden'}</CardTitle>
                    <div className="flex gap-2">
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
                        <Badge variant="outline" className={type === 'ACTIVE' ? 'hidden' : ''}>
                            ₡{order.total.toLocaleString()}
                        </Badge>
                    </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                    {order.restaurant?.address && <p>{order.restaurant.address}</p>}
                    {order.restaurant?.google_maps_url && (
                        <a
                            href={order.restaurant.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:text-primary/80 break-all block"
                        >
                            Ver en Maps 📍
                        </a>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
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
                                    return (
                                        <a
                                            key={i}
                                            href={part}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline hover:text-primary/80 break-all"
                                        >
                                            Open Maps 📍
                                        </a>
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            });
                        })()}
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
                {type === 'ACTIVE' && order.security_code && (
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex flex-col items-center justify-center gap-1 my-2">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Código de Seguridad</span>
                        <span className="text-3xl font-black tracking-widest text-primary font-mono">{order.security_code}</span>
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
                    <Button className="w-full" variant="default" onClick={handleComplete} disabled={isPending}>
                        {isPending ? 'Completing...' : 'Complete Delivery'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
