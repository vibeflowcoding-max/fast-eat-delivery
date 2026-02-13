import { createClient } from '@/lib/supabase/client';

import type { Order, OrderWithDetails, UpdateOrderStatus } from '@/schemas/order.schema';

export class OrderService {
  /**
   * Fetch all delivery orders that are ready for pickup (status_id = 4)
   */
  static async getReadyDeliveryOrders(): Promise<OrderWithDetails[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
        status:order_statuses(*),
        items:order_items(*)
      `)
      .eq('service_mode', 'delivery')
      .in('status_id', [3, 4])
      .is('delivery_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }

    return data as OrderWithDetails[];
  }

  /**
   * Fetch a single order by ID with all details
   */
  static async getOrderById(orderId: string): Promise<OrderWithDetails | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
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

    return data as OrderWithDetails;
  }

  /**
   * Update order status (e.g., from READY (4) to DELIVERING (5))
   */
  static async updateOrderStatus(
    orderId: string,
    payload: UpdateOrderStatus
  ): Promise<Order> {
    const supabase = createClient();
    const { data, error } = await supabase
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
    const supabase = createClient();
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
          
          // Trigger callback if order is in preparing (3) or ready (4)
          if (
            [3, 4].includes(newOrder.status_id) || 
            [3, 4].includes(oldOrder.status_id)
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
  static async getAvailableOrders(driverId: string): Promise<Order[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('service_mode', 'delivery')
      .eq('status_id', 4)
      .is('delivery_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching available orders: ${error.message}`);
    }

    return data as Order[];
  }

  /**
   * Accept an order and assign it to a driver
   */
  static async acceptOrder(orderId: string, driverId: string): Promise<Order> {
    const supabase = createClient();
    const { data, error } = await supabase.from('orders')
      .update({
        delivery_id: driverId,
        status_id: 5, // Out for Delivery
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
  static async completeOrder(orderId: string, driverId: string): Promise<Order> {
    const supabase = createClient();
    const { data, error } = await supabase.from('orders')
      .update({
        status_id: 6, // Completed (assuming 6 is completed status)
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
   * Get active orders for a driver (status_id = 5)
   */
  static async getActiveOrders(driverId: string): Promise<OrderWithDetails[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
        status:order_statuses(*),
        items:order_items(*)
      `)
      .eq('delivery_id', driverId)
      .eq('status_id', 5) // Out for Delivery
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching active orders: ${error.message}`);
    }

    return data as OrderWithDetails[];
  }

  /**
   * Subscribe to real-time changes for a specific driver's active orders (status_id = 5)
   */
  static subscribeToMyOrders(
    driverId: string,
    callback: (payload: { new: Order; old: Order; eventType: string }) => void
  ) {
    const supabase = createClient();
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
    const supabase = createClient();
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
