export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_cart_state: {
        Row: {
          branch_id: string | null
          cart: Json | null
          created_at: string | null
          id: string
          phone: string
          restaurant_context: Json | null
          restaurant_id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          cart?: Json | null
          created_at?: string | null
          id?: string
          phone: string
          restaurant_context?: Json | null
          restaurant_id: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          cart?: Json | null
          created_at?: string | null
          id?: string
          phone?: string
          restaurant_context?: Json | null
          restaurant_id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      branch_inventory: {
        Row: {
          branch_id: string | null
          conversion_factor: number | null
          created_at: string | null
          id: string
          ingredient_id: string
          last_restocked_at: string | null
          max_quantity: number | null
          min_quantity: number | null
          purchase_unit: string | null
          quantity: number
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          id?: string
          ingredient_id: string
          last_restocked_at?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          purchase_unit?: string | null
          quantity?: number
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          id?: string
          ingredient_id?: string
          last_restocked_at?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          purchase_unit?: string | null
          quantity?: number
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_menu_overrides: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          is_available: boolean | null
          menu_item_id: string
          price_override: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          menu_item_id: string
          price_override?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          menu_item_id?: string
          price_override?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_menu_overrides_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_menu_overrides_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_quantity_tables: {
        Row: {
          branch_id: string | null
          id: number
          is_available: boolean
          quantity: number | null
        }
        Insert: {
          branch_id?: string | null
          id?: number
          is_available?: boolean
          quantity?: number | null
        }
        Update: {
          branch_id?: string | null
          id?: number
          is_available?: boolean
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brach_id_tables_brahcn_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_users: {
        Row: {
          auth_user_id: string | null
          branch_id: string | null
          branch_name: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          restaurant_id: string
          role: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          branch_id?: string | null
          branch_name: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          restaurant_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          branch_id?: string | null
          branch_name?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          restaurant_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          delivery_fee: number | null
          delivery_radius_km: number | null
          description: string | null
          email: string | null
          google_maps_url: string | null
          human_addres: string | null
          id: string
          image_url: string | null
          is_accepting_orders: boolean | null
          is_active: boolean | null
          is_main: boolean | null
          latitude: number | null
          longitude: number | null
          min_order_amount: number | null
          name: string
          opening_hours: Json | null
          payment_methods: string[] | null
          phone: string | null
          prep_time_offset: number | null
          restaurant_id: string
          service_modes: string[] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          human_addres?: string | null
          id?: string
          image_url?: string | null
          is_accepting_orders?: boolean | null
          is_active?: boolean | null
          is_main?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_order_amount?: number | null
          name: string
          opening_hours?: Json | null
          payment_methods?: string[] | null
          phone?: string | null
          prep_time_offset?: number | null
          restaurant_id: string
          service_modes?: string[] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          human_addres?: string | null
          id?: string
          image_url?: string | null
          is_accepting_orders?: boolean | null
          is_active?: boolean | null
          is_main?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_order_amount?: number | null
          name?: string
          opening_hours?: Json | null
          payment_methods?: string[] | null
          phone?: string | null
          prep_time_offset?: number | null
          restaurant_id?: string
          service_modes?: string[] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          branch_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          menu_id: string
          name: string
          name_es: string | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          menu_id: string
          name: string
          name_es?: string | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          menu_id?: string
          name?: string
          name_es?: string | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers_chatbot: {
        Row: {
          created_at: string
          customer_name: string | null
          id: number
          phone: string
          request_manual: boolean
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: number
          phone: string
          request_manual?: boolean
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: number
          phone?: string
          request_manual?: boolean
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_chatbot_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string
          restaurant_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name: string
          restaurant_id: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          restaurant_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          branch_inventory_id: string
          created_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          performed_by_staff_id: string | null
          quantity: number
          transaction_type: string
        }
        Insert: {
          branch_inventory_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          performed_by_staff_id?: string | null
          quantity: number
          transaction_type: string
        }
        Update: {
          branch_inventory_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          performed_by_staff_id?: string | null
          quantity?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_branch_inventory_id_fkey"
            columns: ["branch_inventory_id"]
            isOneToOne: false
            referencedRelation: "branch_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_null_payment_method"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_performed_by_staff_id_fkey"
            columns: ["performed_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          redirect_url: string | null
          status: Database["public"]["Enums"]["invitation_status_enum"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          redirect_url?: string | null
          status?: Database["public"]["Enums"]["invitation_status_enum"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          redirect_url?: string | null
          status?: Database["public"]["Enums"]["invitation_status_enum"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      menu_item_categories: {
        Row: {
          category_id: string
          display_order: number
          menu_item_id: string
        }
        Insert: {
          category_id: string
          display_order?: number
          menu_item_id: string
        }
        Update: {
          category_id?: string
          display_order?: number
          menu_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_categories_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_ingredients: {
        Row: {
          id: string
          ingredient_id: string
          menu_item_id: string
          quantity_required: number
        }
        Insert: {
          id?: string
          ingredient_id: string
          menu_item_id: string
          quantity_required: number
        }
        Update: {
          id?: string
          ingredient_id?: string
          menu_item_id?: string
          quantity_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_ingredients_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifier_groups: {
        Row: {
          display_order: number | null
          menu_item_id: string
          modifier_group_id: string
        }
        Insert: {
          display_order?: number | null
          menu_item_id: string
          modifier_group_id: string
        }
        Update: {
          display_order?: number | null
          menu_item_id?: string
          modifier_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_tags: {
        Row: {
          menu_item_id: string
          tag_code: string
        }
        Insert: {
          menu_item_id: string
          tag_code: string
        }
        Update: {
          menu_item_id?: string
          tag_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_tags_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_tags_tag_code_fkey"
            columns: ["tag_code"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["code"]
          },
        ]
      }
      menu_item_variants: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          is_default: boolean
          menu_item_id: string
          name: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          menu_item_id: string
          name: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          menu_item_id?: string
          name?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_variants_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          branch_id: string
          calories: number | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_es: string | null
          prep_time: number | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          calories?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_es?: string | null
          prep_time?: number | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          calories?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_es?: string | null
          prep_time?: number | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          slug: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          slug: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          slug?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          max_selection: number | null
          min_selection: number | null
          name: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_selection?: number | null
          min_selection?: number | null
          name: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_selection?: number | null
          min_selection?: number | null
          name?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_items: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_available: boolean | null
          name: string
          price_adjustment: number | null
          snooze_until: string | null
          stock_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_available?: boolean | null
          name: string
          price_adjustment?: number | null
          snooze_until?: string | null
          stock_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_available?: boolean | null
          name?: string
          price_adjustment?: number | null
          snooze_until?: string | null
          stock_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifier_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          created_at: string | null
          id: number
          message: Json
          phone: string | null
          restaurant_id: string | null
          role: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: Json
          phone?: string | null
          restaurant_id?: string | null
          role?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: Json
          phone?: string | null
          restaurant_id?: string | null
          role?: string | null
          session_id?: string
        }
        Relationships: []
      }
      order_item_modifiers: {
        Row: {
          created_at: string | null
          id: string
          modifier_item_id: string
          name: string
          order_item_id: string
          price: number
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          modifier_item_id: string
          name: string
          order_item_id: string
          price: number
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          modifier_item_id?: string
          name?: string
          order_item_id?: string
          price?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_modifier_item_id_fkey"
            columns: ["modifier_item_id"]
            isOneToOne: false
            referencedRelation: "modifier_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          name: string
          order_id: string
          price: number
          quantity: number
          special_instructions: string | null
          subtotal: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          name: string
          order_id: string
          price: number
          quantity: number
          special_instructions?: string | null
          subtotal: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          name?: string
          order_id?: string
          price?: number
          quantity?: number
          special_instructions?: string | null
          subtotal?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_items_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_items_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_null_payment_method"
            referencedColumns: ["id"]
          },
        ]
      }
      order_statuses: {
        Row: {
          allows_transition_to: string[] | null
          category: string
          code: string
          color_hex: string | null
          created_at: string | null
          description: string | null
          has_timestamp: boolean | null
          icon_name: string | null
          id: number
          is_final: boolean | null
          label: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          allows_transition_to?: string[] | null
          category: string
          code: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          has_timestamp?: boolean | null
          icon_name?: string | null
          id?: number
          is_final?: boolean | null
          label: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          allows_transition_to?: string[] | null
          category?: string
          code?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          has_timestamp?: boolean | null
          icon_name?: string | null
          id?: number
          is_final?: boolean | null
          label?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          accepted_at: string | null
          accepted_by_user: boolean | null
          branch_id: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_id: string
          deleted_at: string | null
          delivered_at: string | null
          delivering_at: string | null
          delivery_address: string | null
          delivery_fee: number | null
          delivery_id: string | null
          estimated_time: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_method_id: number | null
          picked_up_at: string | null
          preparing_at: string | null
          processed_by_staff_id: string | null
          ready_at: string | null
          refunded_at: string | null
          restaurant_id: string
          security_code: string | null
          service_mode: string
          station_status: Json | null
          status_id: number
          table_number: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user?: boolean | null
          branch_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id: string
          deleted_at?: string | null
          delivered_at?: string | null
          delivering_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_id?: string | null
          estimated_time?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_method_id?: number | null
          picked_up_at?: string | null
          preparing_at?: string | null
          processed_by_staff_id?: string | null
          ready_at?: string | null
          refunded_at?: string | null
          restaurant_id: string
          security_code?: string | null
          service_mode?: string
          station_status?: Json | null
          status_id?: number
          table_number?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user?: boolean | null
          branch_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string
          deleted_at?: string | null
          delivered_at?: string | null
          delivering_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_id?: string | null
          estimated_time?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_method_id?: number | null
          picked_up_at?: string | null
          preparing_at?: string | null
          processed_by_staff_id?: string | null
          ready_at?: string | null
          refunded_at?: string | null
          restaurant_id?: string
          security_code?: string | null
          service_mode?: string
          station_status?: Json | null
          status_id?: number
          table_number?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_business"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_delivery"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_processed_by_staff_id_fkey"
            columns: ["processed_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "order_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          category: string | null
          code: string
          color_hex: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          icon_name: string | null
          icon_url: string | null
          id: number
          is_default: boolean | null
          label: string
          payment_processing_fee: number | null
          requires_receipt: boolean | null
          requires_reference: boolean | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          code: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          icon_name?: string | null
          icon_url?: string | null
          id?: number
          is_default?: boolean | null
          label: string
          payment_processing_fee?: number | null
          requires_receipt?: boolean | null
          requires_reference?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          icon_name?: string | null
          icon_url?: string | null
          id?: number
          is_default?: boolean | null
          label?: string
          payment_processing_fee?: number | null
          requires_receipt?: boolean | null
          requires_reference?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      premium_features: {
        Row: {
          ai_chat_count_today: number | null
          ai_chat_last_reset: string | null
          ai_chat_max_daily: number | null
          ai_insights_count_today: number | null
          ai_insights_last_reset: string | null
          ai_insights_max_daily: number | null
          assistant_chat: boolean
          created_at: string
          insights_analytics: boolean
          menu_optimizer: boolean
          menu_optimizer_count_today: number | null
          menu_optimizer_last_reset: string | null
          menu_optimizer_max_daily: number | null
          menu_optimizer_remaining: number | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          ai_chat_count_today?: number | null
          ai_chat_last_reset?: string | null
          ai_chat_max_daily?: number | null
          ai_insights_count_today?: number | null
          ai_insights_last_reset?: string | null
          ai_insights_max_daily?: number | null
          assistant_chat?: boolean
          created_at?: string
          insights_analytics?: boolean
          menu_optimizer?: boolean
          menu_optimizer_count_today?: number | null
          menu_optimizer_last_reset?: string | null
          menu_optimizer_max_daily?: number | null
          menu_optimizer_remaining?: number | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          ai_chat_count_today?: number | null
          ai_chat_last_reset?: string | null
          ai_chat_max_daily?: number | null
          ai_insights_count_today?: number | null
          ai_insights_last_reset?: string | null
          ai_insights_max_daily?: number | null
          assistant_chat?: boolean
          created_at?: string
          insights_analytics?: boolean
          menu_optimizer?: boolean
          menu_optimizer_count_today?: number | null
          menu_optimizer_last_reset?: string | null
          menu_optimizer_max_daily?: number | null
          menu_optimizer_remaining?: number | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_features_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          amount: number
          channel: string
          created_at: string
          currency_code: string
          id: string
          period: unknown
          service_mode: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          amount: number
          channel: string
          created_at?: string
          currency_code?: string
          id?: string
          period?: unknown
          service_mode?: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          amount?: number
          channel?: string
          created_at?: string
          currency_code?: string
          id?: string
          period?: unknown
          service_mode?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      restaurant_restaurant_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          restaurant_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          restaurant_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_restaurant_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "restaurant_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_restaurant_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          created_at: string | null
          id: string
          is_busy_mode: boolean | null
          prep_time_offset: number | null
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_busy_mode?: boolean | null
          prep_time_offset?: number | null
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_busy_mode?: boolean | null
          prep_time_offset?: number | null
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_token_plans: {
        Row: {
          created_at: string | null
          extra_purchase_count: number
          extra_tokens: number
          id: string
          period_end: string
          period_start: string
          period_type: string
          restaurant_id: string
          tokens_assigned: number
          tokens_used: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extra_purchase_count?: number
          extra_tokens?: number
          id?: string
          period_end: string
          period_start?: string
          period_type: string
          restaurant_id: string
          tokens_assigned: number
          tokens_used?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extra_purchase_count?: number
          extra_tokens?: number
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          restaurant_id?: string
          tokens_assigned?: number
          tokens_used?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_token_plans_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_token_purchases: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          id: string
          plan_id: string
          restaurant_id: string
          tokens_added: number
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          id?: string
          plan_id: string
          restaurant_id: string
          tokens_added: number
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          id?: string
          plan_id?: string
          restaurant_id?: string
          tokens_added?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_token_purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "restaurant_token_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_token_purchases_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_token_usage: {
        Row: {
          agent: string | null
          created_at: string | null
          id: string
          input_tokens: number
          output_tokens: number
          plan_id: string
          reasoning_tokens: number | null
          restaurant_id: string
          total_tokens: number | null
        }
        Insert: {
          agent?: string | null
          created_at?: string | null
          id?: string
          input_tokens?: number
          output_tokens?: number
          plan_id: string
          reasoning_tokens?: number | null
          restaurant_id: string
          total_tokens?: number | null
        }
        Update: {
          agent?: string | null
          created_at?: string | null
          id?: string
          input_tokens?: number
          output_tokens?: number
          plan_id?: string
          reasoning_tokens?: number | null
          restaurant_id?: string
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_token_usage_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "restaurant_token_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_token_usage_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          cover_image_url: string | null
          created_at: string | null
          days_open: string[] | null
          description: string | null
          email: string | null
          google_maps_url: string | null
          id: string
          inventory_enabled: boolean | null
          is_active: boolean
          is_busy_mode: boolean | null
          kds_stations_enabled: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          menu_url: string | null
          name: string
          opening_hours: string | null
          owner_id: string | null
          payment_methods: string[] | null
          phone: string | null
          prep_time_offset: number | null
          rating: number | null
          service_modes: string[] | null
          slug: string | null
          sucursales: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          days_open?: string[] | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          id?: string
          inventory_enabled?: boolean | null
          is_active?: boolean
          is_busy_mode?: boolean | null
          kds_stations_enabled?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          menu_url?: string | null
          name: string
          opening_hours?: string | null
          owner_id?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          prep_time_offset?: number | null
          rating?: number | null
          service_modes?: string[] | null
          slug?: string | null
          sucursales?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          days_open?: string[] | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          id?: string
          inventory_enabled?: boolean | null
          is_active?: boolean
          is_busy_mode?: boolean | null
          kds_stations_enabled?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          menu_url?: string | null
          name?: string
          opening_hours?: string | null
          owner_id?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          prep_time_offset?: number | null
          rating?: number | null
          service_modes?: string[] | null
          slug?: string | null
          sucursales?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          permissions: Json
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_type: {
        Row: {
          created_at: string
          id: number
          service: string
        }
        Insert: {
          created_at?: string
          id?: number
          service: string
        }
        Update: {
          created_at?: string
          id?: number
          service?: string
        }
        Relationships: []
      }
      shift_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          restaurant_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          restaurant_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_notes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          avatar_url: string | null
          can_roam: boolean | null
          created_at: string | null
          full_name: string
          home_branch_id: string | null
          id: string
          is_active: boolean | null
          pin_hash: string
          restaurant_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_roam?: boolean | null
          created_at?: string | null
          full_name: string
          home_branch_id?: string | null
          id?: string
          is_active?: boolean | null
          pin_hash: string
          restaurant_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_roam?: boolean | null
          created_at?: string | null
          full_name?: string
          home_branch_id?: string | null
          id?: string
          is_active?: boolean | null
          pin_hash?: string
          restaurant_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_home_branch_id_fkey"
            columns: ["home_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_sessions: {
        Row: {
          branch_id: string | null
          branch_user_id: string | null
          device_info: Json | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          staff_id: string
          started_at: string | null
        }
        Insert: {
          branch_id?: string | null
          branch_user_id?: string | null
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          staff_id: string
          started_at?: string | null
        }
        Update: {
          branch_id?: string | null
          branch_user_id?: string | null
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          staff_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_sessions_branch_user_id_fkey"
            columns: ["branch_user_id"]
            isOneToOne: false
            referencedRelation: "branch_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_sessions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          code: string
          name: string
          name_es: string | null
        }
        Insert: {
          code: string
          name: string
          name_es?: string | null
        }
        Update: {
          code?: string
          name?: string
          name_es?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          phone: string | null
          role_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_role"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      invitation_stats: {
        Row: {
          accepted_count: number | null
          admin_count: number | null
          cancelled_count: number | null
          expired_count: number | null
          last_invitation_sent: string | null
          pending_count: number | null
          total_count: number | null
        }
        Relationships: []
      }
      orders_with_details: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number | null
          estimated_time: number | null
          id: string | null
          items: Json | null
          notes: string | null
          payment_method_code: string | null
          payment_method_id: number | null
          payment_method_label: string | null
          restaurant_id: string | null
          status_code: string | null
          status_id: number | null
          status_label: string | null
          total: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_business"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "order_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_with_null_payment_method: {
        Row: {
          business_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_method_id: number | null
          total: number | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_method_id?: number | null
          total?: number | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_method_id?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orders_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bytea_to_text: { Args: { data: string }; Returns: string }
      calculate_order_total: { Args: { p_order_id: string }; Returns: number }
      create_branch_order:
        | {
            Args: {
              p_branch_id: string
              p_currency?: string
              p_customer: Json
              p_delivery_address?: string
              p_delivery_fee?: number
              p_items: Json
              p_notes?: string
              p_payment_method_code: string
              p_restaurant_id: string
              p_service_fee?: number
              p_tax_rate?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_branch_id: string
              p_currency?: string
              p_customer: Json
              p_delivery_address?: string
              p_delivery_fee?: number
              p_items: Json
              p_notes?: string
              p_payment_method_code: string
              p_restaurant_id: string
              p_service_fee?: number
              p_service_mode?: string
              p_table_number?: number
              p_tax_rate?: number
            }
            Returns: Json
          }
      create_order: {
        Args: {
          p_currency?: string
          p_customer: Json
          p_delivery_address?: string
          p_delivery_fee?: number
          p_items: Json
          p_notes?: string
          p_payment_method_code: string
          p_restaurant_id: string
          p_service_fee?: number
          p_tax_rate?: number
        }
        Returns: Json
      }
      create_staff_session: {
        Args: {
          p_branch_id: string
          p_branch_user_id?: string
          p_device_info?: Json
          p_staff_id: string
        }
        Returns: string
      }
      end_staff_session: { Args: { p_session_id: string }; Returns: boolean }
      generate_order_security_code: { Args: never; Returns: string }
      get_active_staff_session: {
        Args: { p_staff_id: string }
        Returns: {
          branch_id: string
          session_id: string
          started_at: string
        }[]
      }
      get_branch_user_claims: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
      get_user_branch_id: { Args: never; Returns: string }
      get_user_branch_id_from_db: { Args: never; Returns: string }
      get_user_restaurant_id: { Args: never; Returns: string }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_branch_user: { Args: never; Returns: boolean }
      is_delivery_user: { Args: never; Returns: boolean }
      is_restaurant_owner: { Args: never; Returns: boolean }
      mark_expired_invitations: { Args: never; Returns: number }
      parse_opening_hours_to_jsonb: {
        Args: { days_array: string[]; hours_text: string }
        Returns: Json
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      update_branch_user_last_login: {
        Args: { p_auth_user_id: string }
        Returns: undefined
      }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      use_restaurant_tokens:
        | {
            Args: {
              p_input_tokens: number
              p_output_tokens: number
              p_restaurant_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_agent: string
              p_input_tokens: number
              p_output_tokens: number
              p_restaurant_id: string
            }
            Returns: undefined
          }
      validate_order_status_transition: {
        Args: {
          p_current_status: Database["public"]["Enums"]["order_status"]
          p_new_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: boolean
      }
      verify_staff_pin: {
        Args: {
          p_branch_id: string
          p_pin_hash: string
          p_restaurant_id: string
        }
        Returns: {
          avatar_url: string
          can_roam: boolean
          full_name: string
          home_branch_id: string
          role: string
          staff_id: string
        }[]
      }
    }
    Enums: {
      invitation_status_enum: "pending" | "accepted" | "expired" | "cancelled"
      order_status:
        | "PENDING"
        | "ACCEPTED"
        | "PREPARING"
        | "READY"
        | "DELIVERING"
        | "COMPLETED"
        | "CANCELLED"
      payment_method: "CASH" | "CARD" | "SINPE" | "TRANSFER"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invitation_status_enum: ["pending", "accepted", "expired", "cancelled"],
      order_status: [
        "PENDING",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "DELIVERING",
        "COMPLETED",
        "CANCELLED",
      ],
      payment_method: ["CASH", "CARD", "SINPE", "TRANSFER"],
    },
  },
} as const
