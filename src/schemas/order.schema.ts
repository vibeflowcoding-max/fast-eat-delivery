import { z } from 'zod';

export const OrderStatusSchema = z.object({
  id: z.number(),
  code: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  weight: z.number().nullable(),
  color_hex: z.string().nullable(),
  icon_name: z.string().nullable(),
});

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const RestaurantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  google_maps_url: z.string().nullable(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  email: z.string().email().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  total: z.number().nonnegative(),
  delivery_fee: z.number().nonnegative().nullable(),
  estimated_time: z.number().positive().nullable(),
  payment_method: z.enum(['CASH', 'CARD', 'SINPE', 'TRANSFER']),
  delivery_address: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  status_id: z.number(),
  service_mode: z.enum(['pickup', 'delivery', 'dine_in', 'takeaway']),
  order_number: z.string(),
  security_code: z.string().nullable(),
  delivery_id: z.string().uuid().nullable(),
  customer_latitude: z.number().nullable().optional(),
  customer_longitude: z.number().nullable().optional(),
  // Auction-related fields
  delivery_distance_km: z.number().nonnegative().nullable().optional(),
  delivery_base_price: z.number().nonnegative().nullable().optional(),
  delivery_final_price: z.number().nonnegative().nullable().optional(),
  auction_started_at: z.string().nullable().optional(),
  auction_ended_at: z.string().nullable().optional(),
  auction_timeout_minutes: z.number().positive().nullable().optional(),
});

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  menu_item_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  subtotal: z.number(),
  special_instructions: z.string().nullable(),
});

export const OrderWithDetailsSchema = OrderSchema.extend({
  customer: CustomerSchema,
  restaurant: RestaurantSchema,
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema),
});

export const UpdateOrderStatusSchema = z.object({
  status_id: z.number().positive(),
  delivery_id: z.string().uuid().optional(),
});

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Restaurant = z.infer<typeof RestaurantSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderWithDetails = z.infer<typeof OrderWithDetailsSchema>;
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;
