'use server';

import { OrderService } from '@/services/order.service';
import { Order, OrderWithDetails } from '@/schemas/order.schema';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };

export async function getFeed(driverId: string): Promise<ActionResponse<OrderWithDetails[]>> {
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const orders = await OrderService.getAvailableOrders(driverId, supabase);
    return { success: true, data: orders };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function acceptOrder(orderId: string, driverId: string): Promise<ActionResponse<Order>> {
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const order = await OrderService.acceptOrder(orderId, driverId, supabase);
    revalidatePath('/feed');
    revalidatePath('/active-order');
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function completeOrder(orderId: string, driverId: string): Promise<ActionResponse<Order>> {
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const order = await OrderService.completeOrder(orderId, driverId, supabase);
    revalidatePath('/feed');
    revalidatePath('/active-order');
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getActiveOrder(driverId: string): Promise<ActionResponse<OrderWithDetails | null>> {
    try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const supabase = await createServerClient();
        const orders = await OrderService.getActiveOrders(driverId, supabase);
        const order = orders.length > 0 ? orders[0] : null;
        return { success: true, data: order };
    } catch (error) {
        return { success: false, error: "Failed to fetch active order" };
    }
}
