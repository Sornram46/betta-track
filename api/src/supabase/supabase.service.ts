import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabaseClient: SupabaseClient | undefined;

  get client(): SupabaseClient {
    if (this.supabaseClient) return this.supabaseClient;

    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      throw new ServiceUnavailableException(
        'Set SUPABASE_URL and SUPABASE_SECRET_KEY in api/.env before database requests.',
      );
    }

    this.supabaseClient = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return this.supabaseClient;
  }

  async checkConnection(): Promise<void> {
    const { error } = await this.client.from('ponds').select('id', {
      head: true,
      count: 'exact',
    });

    if (error) {
      throw new InternalServerErrorException(
        `Supabase query failed: ${error.message}`,
      );
    }
  }
}