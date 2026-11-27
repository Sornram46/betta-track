import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fishService.findOne(id);
  }

  // Admin-only: the Next.js app checks the user's role before forwarding these.
  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateFishDto: CreateFishDto) {
    return this.fishService.update(id, updateFishDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fishService.remove(id);
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