import { useLocalSearchParams } from 'expo-router';
import { OrderDetailScreen } from '@delivery-app/app/features/orders/detail-screen';

export default function OrderDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <OrderDetailScreen id={id} />;
}
