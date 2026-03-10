import { supabase } from '../lib/supabase';
import { Order } from '../types/database';

export const OrderService = {
    // Fetch active auctions — only fields used by OrderCard/index.tsx
    async getActiveAuctions(driverId?: string): Promise<Order[]> {

        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                status_id,
                created_at,
                delivery_base_price,
                delivery_distance_km,
                customer_latitude,
                customer_longitude,
                customer:customers(
                    name,
                    full_name:name,
                    first_name:name,
                    last_name:name
                ),
                restaurant:restaurants(
                    name,
                    address,
                    latitude,
                    longitude
                )
            `)
            .eq('service_mode', 'delivery')
            .in('status_id', [7]) // AUCTION_ACTIVE
            .is('delivery_id', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // If driverId is provided, fetch their active bids and filter them out
        let filteredData = data || [];
        if (driverId) {
            const { data: bids } = await supabase
                .from('delivery_bids')
                .select('order_id')
                .eq('driver_id', driverId)
                .in('status', ['pending', 'countered']);

            if (bids && bids.length > 0) {
                const bidOrderIds = new Set(bids.map(b => b.order_id));
                filteredData = filteredData.filter(order => !bidOrderIds.has(order.id));
            }
        }

        return filteredData.map((order: any) => ({

            ...order,
            restaurants: order.restaurant,
        })) as unknown as Order[];
    },

    // Subscribe to new orders or status changes
    subscribeToAuctions(onNewOrder: (order: Order) => void, onStatusChange: (payload: any) => void) {
        return supabase
            .channel('orders_auction')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders', filter: 'status_id=eq.7' },
                async (payload) => {
                    // Fetch only fields used by OrderCard
                    const { data } = await supabase
                        .from('orders')
                        .select(`
                            id,
                            status_id,
                            created_at,
                            delivery_base_price,
                            delivery_distance_km,
                            customer_latitude,
                            customer_longitude,
                            customer:customers(
                                name,
                                full_name:name,
                                first_name:name,
                                last_name:name
                            ),
                            restaurant:restaurants(
                                name,
                                address,
                                latitude,
                                longitude
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        const mappedOrder = {
                            ...data,
                            restaurants: (data as any).restaurant,
                        };
                        onNewOrder(mappedOrder as unknown as Order);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                onStatusChange
            )
            .subscribe();
    },

    // Get a single order by ID — only fields used by order-details screen
    async getOrderById(orderId: string): Promise<Order | null> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                status_id,
                delivery_address,
                delivery_base_price,
                delivery_distance_km,
                delivery_fee,
                customer_latitude,
                customer_longitude,
                order_number,
                source,
                customer:customers(
                    id,
                    name,
                    phone
                ),
                restaurant:restaurants(
                    name,
                    address,
                    latitude,
                    longitude
                ),
                items:order_items(
                    id,
                    name,
                    quantity,
                    special_instructions
                )
            `)
            .eq('id', orderId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;


        return {
            ...data,
            restaurants: (data as any).restaurant,
        } as unknown as Order;
    },

    // Accept an order (create a bid or assign driver depending on business logic)
    // For simplicity, we'll try to just update the status if allowed
    async acceptOrder(orderId: string, userId: string) {
        // In a real app, this would create a 'delivery_bid' or update 'driver_id'
        const { error } = await supabase
            .from('orders')
            .update({
                status_id: 8, // DRIVER_ASSIGNED
                delivery_id: userId
            })

            .eq('id', orderId)
            .eq('status_id', 7);

        if (error) throw error;
    },

    // Get current active order for the driver
    async getCurrentActiveOrder(driverId: string): Promise<Order | null> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                status_id,
                delivery_address,
                customer:customers(id, name, phone),
                restaurant:restaurants(id, name, address, latitude, longitude)
            `)
            .eq('delivery_id', driverId)
            .in('status_id', [8, 11]) // DRIVER_ASSIGNED or DELIVERING
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;


        return {
            ...data,
            restaurants: (data as any).restaurant,
        } as unknown as Order;
    },

    async updateStatus(orderId: string, statusId: number) {
        const { error } = await supabase
            .from('orders')
            .update({ status_id: statusId })
            .eq('id', orderId);
        if (error) throw error;
    },

    async finalizeDelivery(orderId: string, securityCode: string) {
        // Verify security code first
        const { data, error: fetchError } = await supabase
            .from('orders')
            .select('security_code')
            .eq('id', orderId)
            .single();

        if (fetchError) throw fetchError;
        if (data.security_code !== securityCode) {
            throw new Error('Código de seguridad incorrecto');
        }

        const { error } = await supabase
            .from('orders')
            .update({
                status_id: 12, // DELIVERED
                delivered_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;
    },

    // Get statistics for the driver
    async getDriverStats(driverId: string) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch Today's stats
        const { data: todayData, error: todayError } = await supabase
            .from('orders')
            .select('delivery_final_price')
            .eq('delivery_id', driverId)
            .eq('status_id', 12) // DELIVERED
            .gte('delivered_at', startOfToday);

        if (todayError) throw todayError;

        // Fetch Month's stats
        const { data: monthData, error: monthError } = await supabase
            .from('orders')
            .select('delivery_final_price')
            .eq('delivery_id', driverId)
            .eq('status_id', 12)
            .gte('delivered_at', startOfMonth);

        if (monthError) throw monthError;

        const todayEarnings = (todayData || []).reduce((acc, row) => acc + (row.delivery_final_price || 0), 0);
        const monthEarnings = (monthData || []).reduce((acc, row) => acc + (row.delivery_final_price || 0), 0);

        return {
            todayCount: todayData?.length || 0,
            todayEarnings,
            monthCount: monthData?.length || 0,
            monthEarnings
        };
    }
};

