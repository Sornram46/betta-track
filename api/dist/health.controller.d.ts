import { SupabaseService } from './supabase/supabase.service';
export declare class HealthController {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    getHealth(): {
        status: string;
    };
    getDatabaseHealth(): Promise<{
        status: string;
        database: string;
    }>;
}
