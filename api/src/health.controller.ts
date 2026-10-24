import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  getHealth() {
    return { status: 'ok' };
  }

  @Get('database')
  async getDatabaseHealth() {
    await this.supabase.checkConnection();
    return { status: 'ok', database: 'connected' };
  }
}