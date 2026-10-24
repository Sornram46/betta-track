import { Module } from '@nestjs/common';
import { FishModule } from './fish/fish.module';
import { HealthController } from './health.controller';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [SupabaseModule, FishModule],
  controllers: [HealthController],
})
export class AppModule {}