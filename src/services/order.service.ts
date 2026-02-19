import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

import type { Order, OrderWithDetails, UpdateOrderStatus } from '@/schemas/order.schema';

export class OrderService {
  /**
   * Fetch all delivery orders that are ready for pickup (status_id = 4),
   * preparing (status_id = 3), or in active auction (status_id = 7)
   * 
   * InDrive Model: Orders remain visible to all drivers during auction
   * so multiple drivers can submit bids. Order only disappears when
   * a bid is accepted and driver is assigned.
   */
  static async getReadyDeliveryOrders(supabase?: SupabaseClient<Database>): Promise<OrderWithDetails[]> {
    const client = supabase || createBrowserClient();
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
        branch:branches(*),
        status:order_statuses(*),
        items:order_items(*)
      `)
      .eq('service_mode', 'delivery')
      .in('status_id', [7])  // Only AUCTION_ACTIVE
      .is('delivery_id', null)  // Only unassigned orders
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }

    // Merge branch data into restaurant if available
    const orders = (data || []).map((order: any) => ({
      ...order,
      restaurant: order.branch || order.restaurant
    }));

    return orders as OrderWithDetails[];
  }

  /**
   * Fetch a single order by ID with all details
   */
  static async getOrderById(orderId: string, supabase?: SupabaseClient<Database>): Promise<OrderWithDetails | null> {
    const client = supabase || createBrowserClient();
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
        branch:branches(*),
        status:order_statuses(*),
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching order: ${error.message}`);
    }

    // Merge branch data into restaurant if available
    const order = {
      ...data,
      restaurant: (data as any).branch || (data as any).restaurant
    };

    return order as OrderWithDetails;
  }

  /**
   * Update order status (e.g., from READY (4) to DELIVERING (5))
   */
  static async updateOrderStatus(
    orderId: string,
    payload: UpdateOrderStatus,
    supabase?: SupabaseClient<Database>
  ): Promise<Order> {
    const client = supabase || createBrowserClient();
    const { data, error } = await client
      .from('orders')
      .update(payload)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }

    return data as Order;
  }

  /**
   * Subscribe to real-time changes for delivery orders with status_id = 4
   */
  static subscribeToReadyOrders(
    callback: (payload: { new: Order; old: Order; eventType: string }) => void
  ) {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel('ready-delivery-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'service_mode=eq.delivery',
        },
        (payload) => {
          const newOrder = payload.new as Order;
          const oldOrder = payload.old as Order;
          
          // Trigger callback if order is in Auction (7)
          if (
            newOrder.status_id === 7 || 
            oldOrder.status_id === 7
          ) {
            callback({
              new: newOrder,
              old: oldOrder,
              eventType: payload.eventType,
            });
          }
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Get available orders for a driver (alias for getReadyDeliveryOrders)
   */
  static async getAvailableOrders(driverId: string, supabase?: SupabaseClient<Database>): Promise<OrderWithDetails[]> {
    const client = supabase || createBrowserClient();
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
        branch:branches(*),
        status:order_statuses(*),
        items:order_items(*)
      `)
      .eq('service_mode', 'delivery')
      .in('status_id', [7])  // Show only Auction Active (7)
      .is('delivery_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching available orders: ${error.message}`);
    }

    // Merge branch data into restaurant if available
    const orders = (data || []).map((order: any) => ({
      ...order,
      restaurant: order.branch || order.restaurant
    }));

    return orders as OrderWithDetails[];
  }

  /**
   * Accept an order and assign it to a driver
   */
  static async acceptOrder(orderId: string, driverId: string, supabase?: SupabaseClient<Database>): Promise<Order> {
    const client = supabase || createBrowserClient();
    const { data, error } = await client.from('orders')
      .update({
        delivery_id: driverId,
        status_id: 8, // Driver Assigned (Accepted)
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error accepting order: ${error.message}`);
    }

    return data as Order;
  }

  /**
   * Complete an order
   */
  static async completeOrder(orderId: string, driverId: string, supabase?: SupabaseClient<Database>): Promise<Order> {
    const client = supabase || createBrowserClient();
    const { data, error } = await client.from('orders')
      .update({
        status_id: 11, // Completed
      })
      .eq('id', orderId)
      .eq('delivery_id', driverId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error completing order: ${error.message}`);
    }

    return data as Order;
  }

  /**
   * Get the active order for a driver
   */
  /**
   * Get active orders for a driver
   * - Status 4 (READY): Assigned to driver, waiting for pickup
   * - Status 5 (OUT_FOR_DELIVERY): Driver picked up, on the way
   */
  static async getActiveOrders(driverId: string, supabase?: SupabaseClient<Database>): Promise<OrderWithDetails[]> {
    const client = supabase || createBrowserClient();
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
        branch:branches(*),
        status:order_statuses(*),
        items:order_items(*)
      `)
      .eq('delivery_id', driverId)
      .in('status_id', [8, 5]) // DRIVER_ASSIGNED (8) or DELIVERING (5)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching active orders: ${error.message}`);
    }

    // Merge branch data into restaurant if available
    const orders = (data || []).map((order: any) => ({
      ...order,
      restaurant: order.branch || order.restaurant
    }));

    return orders as OrderWithDetails[];
  }

  /**
   * Subscribe to real-time changes for a specific driver's active orders (status_id = 5)
   */
  static subscribeToMyOrders(
    driverId: string,
    callback: (payload: { new: Order; old: Order; eventType: string }) => void
  ) {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`driver-orders-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `delivery_id=eq.${driverId}`,
        },
        (payload) => {
          callback({
            new: payload.new as Order,
            old: payload.old as Order,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to real-time changes for a single order
   */
  static subscribeToSingleOrder(
    orderId: string,
    callback: (payload: { new: Order; old: Order; eventType: string }) => void
  ) {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`single-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          callback({
            new: payload.new as Order,
            old: payload.old as Order,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();

    return channel;
  }
}
