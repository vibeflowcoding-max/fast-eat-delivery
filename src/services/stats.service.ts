import { createClient } from '@/lib/supabase/client';

export interface DeliveryStats {
  totalDeliveries: number;
  monthlyDeliveries: number;
  todayDeliveries: number;
  monthlyEarnings: number;
  todayEarnings: number;
  averageRating?: number;
}

export class StatsService {
  /**
   * Get comprehensive delivery statistics for a driver
   */
  static async getDeliveryStats(userId: string): Promise<DeliveryStats> {
    const supabase = createClient();

    // Get total deliveries (completed orders)
    const { count: totalDeliveries } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_id', userId)
      .eq('status_id', 6); // Completed status

    // Get monthly deliveries
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyDeliveries } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_id', userId)
      .eq('status_id', 6)
      .gte('created_at', startOfMonth.toISOString());

    // Get today's deliveries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: todayDeliveries } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_id', userId)
      .eq('status_id', 6)
      .gte('created_at', startOfDay.toISOString());

    // Get monthly earnings (sum of delivery fees)
    const { data: monthlyOrders } = await supabase
      .from('orders')
      .select('delivery_fee')
      .eq('delivery_id', userId)
      .eq('status_id', 6)
      .gte('created_at', startOfMonth.toISOString());

    const monthlyEarnings = monthlyOrders?.reduce(
      (sum, order) => sum + (order.delivery_fee || 0),
      0
    ) || 0;

    // Get today's earnings
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('delivery_fee')
      .eq('delivery_id', userId)
      .eq('status_id', 6)
      .gte('created_at', startOfDay.toISOString());

    const todayEarnings = todayOrders?.reduce(
      (sum, order) => sum + (order.delivery_fee || 0),
      0
    ) || 0;

    return {
      totalDeliveries: totalDeliveries || 0,
      monthlyDeliveries: monthlyDeliveries || 0,
      todayDeliveries: todayDeliveries || 0,
      monthlyEarnings,
      todayEarnings,
    };
  }

  /**
   * Get delivery history with filters
   */
  static async getDeliveryHistory(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: number;
    }
  ) {
    const supabase = createClient();
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        restaurant:restaurants(*),
        status:order_statuses(*)
      `)
      .eq('delivery_id', userId)
      .in('status_id', [6, 7]) // Completed or Cancelled
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters?.status) {
      query = query.eq('status_id', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching delivery history: ${error.message}`);
    }

    return data;
  }
}
