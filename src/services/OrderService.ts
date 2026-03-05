import { supabase } from '../lib/supabase';
import { Order } from '../types/database';

export const OrderService = {
    // Fetch active auctions
    async getActiveAuctions(): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select('*, restaurants(*), order_statuses(*)')
            .eq('status_id', 7) // AUCTION_ACTIVE
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Order[];
    },

    // Subscribe to new orders or status changes
    subscribeToAuctions(onNewOrder: (order: Order) => void, onStatusChange: (payload: any) => void) {
        return supabase
            .channel('orders_auction')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders', filter: 'status_id=eq.7' },
                async (payload) => {
                    // Fetch full data for the new order
                    const { data } = await supabase
                        .from('orders')
                        .select('*, restaurants(*), order_statuses(*)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) onNewOrder(data as Order);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                onStatusChange
            )
            .subscribe();
    },

    // Accept an order (create a bid or assign driver depending on business logic)
    // For simplicity, we'll try to just update the status if allowed
    async acceptOrder(orderId: string, userId: string) {
        // In a real app, this would create a 'delivery_bid' or update 'driver_id'
        const { error } = await supabase
            .from('orders')
            .update({
                status_id: 8, // DRIVER_ASSIGNED
                delivering_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .eq('status_id', 7);

        if (error) throw error;
    },

    // Get current active order for the driver
    async getCurrentActiveOrder(): Promise<Order | null> {
        const { data, error } = await supabase
            .from('orders')
            .select('*, restaurants(*), order_statuses(*)')
            .in('status_id', [8, 11]) // DRIVER_ASSIGNED or DELIVERING
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as Order | null;
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
    }
};
