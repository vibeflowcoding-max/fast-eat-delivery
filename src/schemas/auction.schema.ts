/**
 * Auction Schema
 * 
 * Zod schemas for auction-related data validation.
 * Used for type-safe bid creation, counter-offers, and auction management.
 * 
 * @module schemas/auction.schema
 */

import { z } from 'zod';

// ============================================================================
// Bid Status Enum
// ============================================================================

export const BidStatusSchema = z.enum([
  'pending',    // Waiting for customer response
  'accepted',   // Match confirmed!
  'rejected',   // Customer rejected the bid
  'withdrawn',  // Driver cancelled their bid
  'expired',    // Bid timeout
  'countered',  // Customer made a counter-offer
]);

export type BidStatus = z.infer<typeof BidStatusSchema>;

// ============================================================================
// Delivery Bid Schema
// ============================================================================

export const DeliveryBidSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  
  // Pricing
  base_price: z.number().nonnegative(),
  driver_offer: z.number().nonnegative().nullable(),
  customer_counter_offer: z.number().nonnegative().nullable(),
  final_price: z.number().nonnegative().nullable(),
  
  // Status
  status: BidStatusSchema,
  
  // Metadata
  distance_km: z.number().nonnegative().nullable(),
  estimated_time_minutes: z.number().positive().nullable(),
  driver_notes: z.string().nullable(),
  
  // Timestamps
  created_at: z.string(),
  accepted_at: z.string().nullable(),
  rejected_at: z.string().nullable(),
  expires_at: z.string(),
  updated_at: z.string(),
});

export type DeliveryBid = z.infer<typeof DeliveryBidSchema>;

// ============================================================================
// Create Bid Input Schema
// ============================================================================

export const CreateBidInputSchema = z.object({
  order_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  driver_offer: z.number().nonnegative().nullable().optional(),
  distance_km: z.number().nonnegative().optional(),
  estimated_time_minutes: z.number().positive().optional(),
  driver_notes: z.string().max(500).optional(),
});

export type CreateBidInput = z.infer<typeof CreateBidInputSchema>;

// ============================================================================
// Counter Offer Input Schema
// ============================================================================

export const CounterOfferInputSchema = z.object({
  bid_id: z.string().uuid(),
  customer_counter_offer: z.number().nonnegative(),
});

export type CounterOfferInput = z.infer<typeof CounterOfferInputSchema>;

// ============================================================================
// Active Auction Schema
// ============================================================================

export const ActiveAuctionSchema = z.object({
  order_id: z.string().uuid(),
  order_number: z.string(),
  restaurant_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  delivery_address: z.string().nullable(),
  delivery_distance_km: z.number().nonnegative().nullable(),
  delivery_base_price: z.number().nonnegative().nullable(),
  auction_started_at: z.string().nullable(),
  auction_timeout_minutes: z.number().positive().nullable(),
  auction_expires_at: z.string().nullable(),
  pending_bids_count: z.number().nonnegative(),
  countered_bids_count: z.number().nonnegative(),
  lowest_bid: z.number().nonnegative().nullable(),
  highest_bid: z.number().nonnegative().nullable(),
});

export type ActiveAuction = z.infer<typeof ActiveAuctionSchema>;

// ============================================================================
// Bid with Details Schema (for UI display)
// ============================================================================

export const BidWithDetailsSchema = DeliveryBidSchema.extend({
  driver: z.object({
    user_id: z.string().uuid(),
    full_name: z.string(),
    phone: z.string().nullable(),
    profile_image_url: z.string().nullable(),
    rating: z.number().min(0).max(5).nullable(),
    total_deliveries: z.number().nonnegative().nullable(),
  }).nullable(),
  order: z.object({
    order_number: z.string(),
    restaurant_name: z.string().nullable(),
    customer_name: z.string(),
    customer_address: z.string().nullable(),
  }).nullable(),
});

export type BidWithDetails = z.infer<typeof BidWithDetailsSchema>;
