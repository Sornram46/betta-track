import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FishModule } from './fish/fish.module';
import { HealthController } from './health.controller';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [SupabaseModule, AuthModule, FishModule],
  controllers: [HealthController],
})
export class AppModule {}