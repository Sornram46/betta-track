import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../common/api-key.guard';
import { FishController } from './fish.controller';
import { FishQrController } from './fish-qr.controller';
import { FishService } from './fish.service';

@Module({
  controllers: [FishController, FishQrController],
  providers: [FishService, ApiKeyGuard],
})
export class FishModule {}