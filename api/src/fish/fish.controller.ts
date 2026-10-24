import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiKeyGuard } from '../common/api-key.guard';
import { CreateFishDto } from './dto/create-fish.dto';
import { FishService } from './fish.service';

interface FishImageUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Controller('fish')
@UseGuards(ApiKeyGuard)
export class FishController {
  constructor(private readonly fishService: FishService) {}

  @Get()
  findAll() {
    return this.fishService.findAll();
  }

  @Post()
  create(@Body() createFishDto: CreateFishDto) {
    return this.fishService.create(createFishDto);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const supported = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
        callback(supported ? null : new BadRequestException('รองรับเฉพาะ JPEG, PNG หรือ WebP'), supported);
      },
    }),
  )
  uploadImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() image: FishImageUpload | undefined,
    @Query('role') role: string | undefined,
  ) {
    if (role && !['fish', 'father', 'mother'].includes(role)) {
      throw new BadRequestException('ประเภทภาพไม่ถูกต้อง');
    }
    return this.fishService.uploadImage(id, image, (role ?? 'fish') as 'fish' | 'father' | 'mother');
  }
}