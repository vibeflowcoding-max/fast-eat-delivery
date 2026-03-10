import { supabase } from '../lib/supabase';

export interface CreateBidInput {
    order_id: string;
    driver_id: string;
    driver_offer: number | null; // null = accept base price
    distance_km?: number | null;
    estimated_time_minutes?: number | null;
    driver_notes?: string | null;
}

export class AuctionService {
    /**
     * Calculate base delivery price from distance
     */
    static calculateBasePrice(distanceKm: number): number {
        const BASE_FEE = 1500;
        const PRICE_PER_KM = 500;
        const MIN_PRICE = 2000;
        const MAX_PRICE = 8000;
        const calculated = BASE_FEE + (distanceKm * PRICE_PER_KM);
        return Math.min(Math.max(calculated, MIN_PRICE), MAX_PRICE);
    }

    /**
     * Create a delivery bid.
     * If driver_offer is null, the driver accepts the base price immediately.
     */
    static async createBid(input: CreateBidInput): Promise<any> {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('delivery_base_price, delivery_distance_km, delivery_id')
            .eq('id', input.order_id)
            .single();

        if (orderError || !order) throw new Error('Orden no encontrada');
        if (order.delivery_id) throw new Error('Esta orden ya fue tomada por otro repartidor');

        const basePrice = order.delivery_base_price || this.calculateBasePrice(order.delivery_distance_km || 3.5);
        const isAutoAccepted = input.driver_offer === null;
        const finalPrice = isAutoAccepted ? basePrice : null;
        const status = isAutoAccepted ? 'accepted' : 'pending';

        const bidPayload = {
            order_id: input.order_id,
            driver_id: input.driver_id,
            base_price: basePrice,
            driver_offer: input.driver_offer ?? null,
            final_price: finalPrice,
            status,
            distance_km: input.distance_km ?? null,
            estimated_time_minutes: input.estimated_time_minutes ?? null,
            driver_notes: input.driver_notes ?? null,
            accepted_at: isAutoAccepted ? new Date().toISOString() : null,
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Check for existing bid from this driver (update instead of insert to avoid unique constraint)
        const { data: existing } = await supabase
            .from('delivery_bids')
            .select('id')
            .eq('order_id', input.order_id)
            .eq('driver_id', input.driver_id)
            .in('status', ['withdrawn', 'expired'])
            .maybeSingle();

        let data, error;
        if (existing) {
            ({ data, error } = await supabase
                .from('delivery_bids')
                .update(bidPayload)
                .eq('id', existing.id)
                .select()
                .single());
        } else {
            ({ data, error } = await supabase
                .from('delivery_bids')
                .insert(bidPayload)
                .select()
                .single());
        }

        if (error) throw new Error(`Error al crear oferta: ${error.message}`);

        // If auto-accepted, update the order status to DRIVER_ASSIGNED
        if (isAutoAccepted) {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status_id: 8,
                    delivery_id: input.driver_id,
                    delivery_final_price: basePrice,
                })
                .eq('id', input.order_id)
                .eq('status_id', 7);

            if (updateError) {
                console.error('[AuctionService] Error assigning order:', updateError);
                throw new Error(`Error al asignar la orden: ${updateError.message}`);
            }
        }


        return data;
    }

    /**
     * Withdraw a bid (driver retracts their offer).
     * Only updates status to avoid schema mismatch with non-existent columns.
     */
    static async withdrawBid(bidId: string, driverId: string): Promise<any> {
        // First confirm the bid belongs to this driver
        const { data: existing, error: fetchErr } = await supabase
            .from('delivery_bids')
            .select('id, status')
            .eq('id', bidId)
            .eq('driver_id', driverId)
            .maybeSingle();

        if (fetchErr) throw new Error(`Error: ${fetchErr.message}`);
        if (!existing) throw new Error('Oferta no encontrada o sin permiso para retirarla.');

        // Only update status — the minimal field guaranteed to exist
        const { data, error } = await supabase
            .from('delivery_bids')
            .update({ status: 'withdrawn' })
            .eq('id', bidId)
            .select()
            .single();

        if (error) throw new Error(`Error al retirar oferta: ${error.message}`);
        return data;
    }

    /**
     * Get all active bids for the current driver
     */
    static async getDriverActiveBids(driverId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('delivery_bids')
            .select(`
                *,
                order:orders(
                    id, order_number, delivery_address, status_id, total,
                    restaurant:restaurants(name, address),
                    customer:customers(name, phone)
                )
            `)
            .eq('driver_id', driverId)
            .in('status', ['pending', 'countered'])
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Error al cargar subastas: ${error.message}`);
        return data || [];
    }

    /**
     * Subscribe to real-time changes for a specific bid
     */
    static subscribeToBid(bidId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`bid:${bidId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'delivery_bids',
                    filter: `id=eq.${bidId}`,
                },
                callback
            )
            .subscribe();
    }

    /**
     * Subscribe to all bids for an order (to detect new counter-offers or status changes)
     */
    static subscribeToBidsForOrder(orderId: string, driverId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`bids_order:${orderId}:${driverId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'delivery_bids',
                    filter: `order_id=eq.${orderId}`,
                },
                callback
            )
            .subscribe();
    }
}
