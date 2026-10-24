import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFishDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsIn(['male', 'female', 'unknown'])
  sex!: 'male' | 'female' | 'unknown';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lineName?: string;

  @IsOptional()
  @IsDateString()
  hatchDate?: string;

  @IsOptional()
  @IsUUID()
  pondId?: string;

  @IsOptional()
  @IsUUID()
  fatherId?: string;

  @IsOptional()
  @IsUUID()
  motherId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fatherLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fatherLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLine?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  generation?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}