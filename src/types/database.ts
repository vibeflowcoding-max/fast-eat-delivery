export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'CANCELLED' | 'REFUNDED' | 'AUCTION_ACTIVE' | 'DRIVER_ASSIGNED' | 'DELIVERING' | 'DELIVERED';

export interface Database {
    public: {
        Tables: {
            orders: {
                Row: {
                    id: string;
                    order_number: string;
                    status_id: number;
                    total: number;
                    delivery_address: string;
                    delivery_final_price: number | null;
                    security_code: string | null;
                    customer_latitude: number | null;
                    customer_longitude: number | null;
                    restaurant_id: string;
                    customer_id: string;
                    created_at: string;
                    delivered_at: string | null;
                };
            };
            order_statuses: {
                Row: {
                    id: number;
                    code: OrderStatus;
                    label: string;
                    color_hex: string;
                };
            };
            delivery_bids: {
                Row: {
                    id: string;
                    order_id: string;
                    driver_id: string;
                    amount: number;
                    status: string;
                    created_at: string;
                };
            };
            restaurants: {
                Row: {
                    id: string;
                    name: string;
                    address: string;
                    phone: string | null;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    push_token: string | null;
                    last_latitude: number | null;
                    last_longitude: number | null;
                    last_location_update: string | null;
                };
            };
        };
    };
}

export type Order = Database['public']['Tables']['orders']['Row'] & {
    order_statuses?: Database['public']['Tables']['order_statuses']['Row'];
    restaurants?: Database['public']['Tables']['restaurants']['Row'];
};
