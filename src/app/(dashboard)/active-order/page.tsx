import { cookies } from 'next/headers';
import { getActiveOrder } from '@/actions/order.actions';
import { OrderCard } from '@/components/dashboard/order-card';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ActiveOrderPage() {
    const driverId = (await cookies()).get('driverId')?.value;
    if (!driverId) redirect('/login');

    const result = await getActiveOrder(driverId);

    if (!result.success) {
        return <div>Error loading active order</div>;
    }

    const order = result.data;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-heading">Current Delivery</h1>
            {!order ? (
                <div className="text-center py-10">
                    <p className="text-muted-foreground mb-4">You have no active orders.</p>
                    <Button asChild>
                        <Link href="/feed">Find Orders</Link>
                    </Button>
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <OrderCard order={order} type="ACTIVE" driverId={driverId} />
                </div>
            )}
        </div>
    );
}
