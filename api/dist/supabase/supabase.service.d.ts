import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService {
    private supabaseClient;
    get client(): SupabaseClient;
    checkConnection(): Promise<void>;
}
