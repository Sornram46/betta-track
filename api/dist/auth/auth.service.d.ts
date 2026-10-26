import { OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
export interface AuthenticatedUser {
    id: string;
    email: string;
    displayName: string | null;
    role: 'owner' | 'member';
}
export declare class AuthService implements OnModuleInit {
    private readonly supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    onModuleInit(): Promise<void>;
    private findByEmail;
    seedOwner(email: string, password: string, displayName: string): Promise<void>;
    validateCredentials(input: LoginDto): Promise<AuthenticatedUser>;
}
