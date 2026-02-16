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
                router.push('/active-order');
            } else {
                alert('Error: ' + res.error);
            }
        });
    };

    const handleComplete = () => {
        startTransition(async () => {
            const res = await completeOrder(order.id, driverId);
            if (res.success) {
                router.push('/feed');
            } else {
                alert('Error: ' + res.error);
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{order.restaurant.name}</CardTitle>
                    <Badge variant="outline">₡{order.total.toLocaleString()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{order.restaurant.address}</p>
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
                            <span className="text-muted-foreground">₡{item.subtotal.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                {order.notes && (
                    <div className="bg-muted p-2 rounded text-sm italic">
                        " {order.notes} "
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {type === 'FEED' && (
                    <Button className="w-full" onClick={handleAccept} disabled={isPending}>
                        {isPending ? 'Accepting...' : 'Accept Order'}
                    </Button>
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
