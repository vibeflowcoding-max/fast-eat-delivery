'use server';

import { OrderService } from '@/services/order.service';
import { Order } from '@/schemas/order.schema';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };

export async function getFeed(driverId: string): Promise<ActionResponse<Order[]>> {
  try {
    const orders = await OrderService.getAvailableOrders(driverId);
    return { success: true, data: orders };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function acceptOrder(orderId: string, driverId: string): Promise<ActionResponse<Order>> {
  try {
    const order = await OrderService.acceptOrder(orderId, driverId);
    revalidatePath('/feed');
    revalidatePath('/active-order');
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function completeOrder(orderId: string, driverId: string): Promise<ActionResponse<Order>> {
  try {
    const order = await OrderService.completeOrder(orderId, driverId);
    revalidatePath('/feed');
    revalidatePath('/active-order');
    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getActiveOrder(driverId: string): Promise<ActionResponse<Order | null>> {
    try {
        const order = await OrderService.getActiveOrder(driverId);
        return { success: true, data: order };
    } catch (error) {
        return { success: false, error: "Failed to fetch active order" };
    }
}
