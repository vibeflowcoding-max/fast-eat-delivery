'use client';
import { useParams } from 'next/navigation';
import { OrderDetailScreen } from '@delivery-app/app/features/orders/detail-screen';

export default function OrderDetailPage() {
    const params = useParams();
    const id = params.id as string;
    return <OrderDetailScreen id={id} />;
}
