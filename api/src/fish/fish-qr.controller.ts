import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { FishService } from './fish.service';

@Controller('fish/qr')
export class FishQrController {
  constructor(private readonly fishService: FishService) {}

  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fishService.findQrDetails(id);
  }
}