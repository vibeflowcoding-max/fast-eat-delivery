/**
 * Auction Service
 * 
 * Handles the auction-based delivery assignment system (InDrive-style).
 * Manages driver bids, price negotiations, and driver-customer matching.
 * 
 * Key Features:
 * - Calculate base delivery prices based on distance
 * - Start auctions for delivery orders
 * - Create and manage driver bids
 * - Handle counter-offers between drivers and customers
 * - Accept/reject bids
 * - Auto-expire old bids
 * 
 * @module services/auction.service
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Types
// ============================================================================

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'countered';

export interface DeliveryBid {
  id: string;
  order_id: string;
  driver_id: string;
  base_price: number;
  driver_offer: number | null;
  customer_counter_offer: number | null;
  final_price: number | null;
  status: BidStatus;
  distance_km: number | null;
  estimated_time_minutes: number | null;
  driver_notes: string | null;
  created_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  expires_at: string;
  updated_at: string;
}

export interface CreateBidInput {
  order_id: string;
  driver_id: string;
  driver_offer?: number | null; // NULL means accept base price
  distance_km?: number;
  estimated_time_minutes?: number;
  driver_notes?: string;
}

export interface CounterOfferInput {
  bid_id: string;
  customer_counter_offer: number;
}

export interface ActiveAuction {
  order_id: string;
  order_number: string;
  restaurant_id: string;
  customer_id: string;
  delivery_address: string | null;
  delivery_distance_km: number | null;
  delivery_base_price: number | null;
  auction_started_at: string | null;
  auction_timeout_minutes: number | null;
  auction_expires_at: string | null;
  pending_bids_count: number;
  countered_bids_count: number;
  lowest_bid: number | null;
  highest_bid: number | null;
}

// ============================================================================
// Service Class
// ============================================================================

export class AuctionService {
  /**
   * Calculate base delivery price based on distance
   * Formula: ₡1,500 + (distance_km × ₡500)
   * Min: ₡2,000, Max: ₡8,000
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
   * Start an auction for a delivery order
   * This changes the order status to AUCTION_ACTIVE and sets the base price
   * 
   * @param orderId - The order ID
   * @param distanceKm - Distance in kilometers
   * @returns The auction result
   */
  static async startAuction(orderId: string, distanceKm: number): Promise<any> {
    const supabase = createClient();

    // Call the database function to start auction (bypasses RLS with SECURITY DEFINER)
    const { data, error } = await supabase.rpc('start_delivery_auction', {
      p_order_id: orderId,
      p_distance_km: distanceKm,
    });

    if (error) {
      console.error('Error starting auction:', error);
      throw new Error(`Failed to start auction: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new bid from a driver
   * If driver_offer is NULL, it means the driver accepts the base price
   */
  static async createBid(input: CreateBidInput): Promise<DeliveryBid> {
    const supabase = createClient();

    // First, get the order to fetch base price
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('delivery_base_price, delivery_distance_km')
      .eq('id', input.order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or not in auction');
    }

    const basePrice = order.delivery_base_price || this.calculateBasePrice(order.delivery_distance_km || 0);

    // Validate driver offer if provided
    if (input.driver_offer !== null && input.driver_offer !== undefined && input.driver_offer < basePrice) {
      throw new Error(`Driver offer (₡${input.driver_offer}) cannot be less than base price (₡${basePrice})`);
    }

    // If driver accepts base price (driver_offer is NULL), auto-accept the bid
    const isAutoAccepted = input.driver_offer === null || input.driver_offer === undefined;
    const finalPrice = isAutoAccepted ? basePrice : null;
    const status: BidStatus = isAutoAccepted ? 'accepted' : 'pending';

    const bidPayload = {
      base_price: basePrice,
      driver_offer: input.driver_offer ?? null,
      customer_counter_offer: null,
      distance_km: input.distance_km ?? null,
      estimated_time_minutes: input.estimated_time_minutes ?? null,
      driver_notes: input.driver_notes ?? null,
      final_price: finalPrice,
      status: status,
      accepted_at: isAutoAccepted ? new Date().toISOString() : null,
      rejected_at: null,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      updated_at: new Date().toISOString(),
    };

    // Check if a previous bid exists (withdrawn or expired) for this driver+order.
    // If so, UPDATE it instead of INSERT to avoid the unique constraint violation.
    const { data: existingBid } = await supabase
      .from('delivery_bids')
      .select('id')
      .eq('order_id', input.order_id)
      .eq('driver_id', input.driver_id)
      .in('status', ['withdrawn', 'expired'])
      .maybeSingle();

    let data: DeliveryBid | null = null;
    let error: { message: string } | null = null;

    if (existingBid) {
      // Re-bid: update the existing record instead of inserting a new one
      const result = await supabase
        .from('delivery_bids')
        .update(bidPayload)
        .eq('id', existingBid.id)
        .select()
        .single();
      data = result.data as DeliveryBid;
      error = result.error;
    } else {
      // First bid: insert a new record
      const result = await supabase
        .from('delivery_bids')
        .insert({ order_id: input.order_id, driver_id: input.driver_id, ...bidPayload })
        .select()
        .single();
      data = result.data as DeliveryBid;
      error = result.error;
    }

    if (error) {
      throw new Error(`Failed to create bid: ${error.message}`);
    }

    return data as DeliveryBid;
  }

  /**
   * Get all active bids for an order
   */
  static async getOrderBids(orderId: string): Promise<DeliveryBid[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('delivery_bids')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['pending', 'countered', 'accepted'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bids: ${error.message}`);
    }

    return data as DeliveryBid[];
  }

  /**
   * Get all bids made by a driver
   */
  static async getDriverBids(driverId: string): Promise<DeliveryBid[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('delivery_bids')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch driver bids: ${error.message}`);
    }

    return data as DeliveryBid[];
  }

  /**
   * Customer makes a counter-offer on a driver's bid
   */
  static async counterOffer(input: CounterOfferInput): Promise<DeliveryBid> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('delivery_bids')
      .update({
        customer_counter_offer: input.customer_counter_offer,
        status: 'countered',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.bid_id)
      .eq('status', 'pending') // Only allow counter-offer on pending bids
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create counter-offer: ${error.message}`);
    }

    return data as DeliveryBid;
  }

  /**
   * Driver accepts a customer's counter-offer
   */
  static async acceptCounterOffer(bidId: string): Promise<DeliveryBid> {
    const supabase = createClient();

    // Get the bid to fetch counter-offer price
    const { data: bid, error: fetchError } = await supabase
      .from('delivery_bids')
      .select('customer_counter_offer')
      .eq('id', bidId)
      .eq('status', 'countered')
      .single();

    if (fetchError || !bid || !bid.customer_counter_offer) {
      throw new Error('Counter-offer not found or bid not in countered state');
    }

    const { data, error } = await supabase
      .from('delivery_bids')
      .update({
        final_price: bid.customer_counter_offer,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to accept counter-offer: ${error.message}`);
    }

    return data as DeliveryBid;
  }

  /**
   * Customer accepts a driver's bid
   */
  static async acceptBid(bidId: string): Promise<DeliveryBid> {
    const supabase = createClient();

    // Get the bid to determine final price
    const { data: bid, error: fetchError } = await supabase
      .from('delivery_bids')
      .select('driver_offer, base_price')
      .eq('id', bidId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !bid) {
      throw new Error('Bid not found or not in pending state');
    }

    const finalPrice = bid.driver_offer || bid.base_price;

    const { data, error } = await supabase
      .from('delivery_bids')
      .update({
        final_price: finalPrice,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to accept bid: ${error.message}`);
    }

    // Note: The trigger will automatically update the order and reject other bids
    return data as DeliveryBid;
  }

  /**
   * Reject a bid (customer or driver)
   */
  static async rejectBid(bidId: string): Promise<DeliveryBid> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('delivery_bids')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)
      .in('status', ['pending', 'countered'])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reject bid: ${error.message}`);
    }

    return data as DeliveryBid;
  }

  /**
   * Driver withdraws their bid
   */
  static async withdrawBid(bidId: string, driverId: string): Promise<DeliveryBid> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('delivery_bids')
      .update({
        status: 'withdrawn',
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)
      .eq('driver_id', driverId)
      .in('status', ['pending', 'countered'])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to withdraw bid: ${error.message}`);
    }

    return data as DeliveryBid;
  }

  /**
   * Get all active auctions
   */
  static async getActiveAuctions(): Promise<ActiveAuction[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('active_auctions')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch active auctions: ${error.message}`);
    }

    return data as ActiveAuction[];
  }

  /**
   * Expire old pending bids
   * Should be called periodically (e.g., via cron job)
   */
  static async expireOldBids(): Promise<number> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('delivery_bids')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to expire bids: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Subscribe to bid changes for an order (real-time)
   */
  static subscribeToBids(orderId: string, callback: (payload: any) => void) {
    const supabase = createClient();

    return supabase
      .channel(`bids:${orderId}`)
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
