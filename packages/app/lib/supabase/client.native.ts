import { Platform } from 'react-native';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '../../types/database';

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
    },
};

export function createClient() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Missing Supabase environment variables');
    }

    return createSupabaseClient<Database>(
        supabaseUrl as string,
        supabaseAnonKey as string,
        {
            auth: {
                storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : undefined,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        }
    );
}
