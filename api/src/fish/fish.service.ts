import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFishDto } from './dto/create-fish.dto';

const FISH_IMAGE_BUCKET = 'fish-images';
const FISH_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
type FishImageRole = 'fish' | 'father' | 'mother';

const IMAGE_PATH_COLUMNS: Record<FishImageRole, 'image_path' | 'father_image_path' | 'mother_image_path'> = {
  fish: 'image_path',
  father: 'father_image_path',
  mother: 'mother_image_path',
};

interface UploadedFishImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

interface FishRelation {
  code: string;
  name: string;
  line_name: string | null;
  hatch_date: string | null;
  generation: number | null;
  image_path: string | null;
}

interface FishRow extends FishRelation {
  id: string;
  sex: 'male' | 'female' | 'unknown';
  image_path: string | null;
  father_image_path: string | null;
  mother_image_path: string | null;
  father_id: string | null;
  mother_id: string | null;
  father_label: string | null;
  father_line: string | null;
  mother_label: string | null;
  mother_line: string | null;
}

function getAgeLabel(hatchDate: string | null): string {
  if (!hatchDate) return 'ไม่ระบุ';

  const born = new Date(`${hatchDate}T00:00:00Z`);
  const now = new Date();
  let years = now.getUTCFullYear() - born.getUTCFullYear();
  let months = now.getUTCMonth() - born.getUTCMonth();
  const days = now.getUTCDate() - born.getUTCDate();

  if (days < 0) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return '0 วัน';
  if (years === 0 && months === 0) {
    const ageInDays = Math.max(
      0,
      Math.floor((now.getTime() - born.getTime()) / 86_400_000),
    );
    return `${ageInDays} วัน`;
  }

  return [years ? `${years} ปี` : '', months ? `${months} เดือน` : '']
    .filter(Boolean)
    .join(' ');
}

function toAncestor(fish: FishRelation | null, imageUrls: Map<string, string>) {
  const imageUrl = fish?.image_path ? imageUrls.get(fish.image_path) ?? null : null;
  return {
    id: fish?.code ?? '-',
    name: fish?.name ?? 'ยังไม่มีข้อมูล',
    age: getAgeLabel(fish?.hatch_date ?? null),
    imageUrl,
  };
}

function toParent(
  parentId: string | null,
  label: string | null,
  line: string | null,
  fishById: Map<string, FishRow>,
  fallbackImagePath: string | null,
  imageUrls: Map<string, string>,
) {
  const fish = parentId ? fishById.get(parentId) ?? null : null;
  const father = fish?.father_id ? fishById.get(fish.father_id) ?? null : null;
  const mother = fish?.mother_id ? fishById.get(fish.mother_id) ?? null : null;
  const imagePath = fish?.image_path ?? fallbackImagePath;

  return {
    id: fish?.code ?? label ?? '-',
    name: fish?.name ?? label ?? 'ยังไม่มีข้อมูล',
    age: getAgeLabel(fish?.hatch_date ?? null),
    generation: fish?.generation ?? undefined,
    imageUrl: imagePath ? imageUrls.get(imagePath) ?? null : null,
    parents: {
      father: toAncestor(father, imageUrls),
      mother: toAncestor(mother, imageUrls),
    },
    line: fish?.line_name ?? line,
  };
}

@Injectable()
export class FishService {
  constructor(private readonly supabase: SupabaseService) {}

  private getImageExtension(file: UploadedFishImage) {
    const bytes = file.buffer;
    if (
      file.mimetype === 'image/jpeg' &&
      bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    ) return 'jpg';
    if (
      file.mimetype === 'image/png' &&
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) return 'png';
    if (
      file.mimetype === 'image/webp' &&
      bytes.length >= 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    ) return 'webp';

    throw new BadRequestException('รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP ที่ถูกต้อง');
  }

  private async getSignedImageUrl(path: string | null) {
    if (!path) return null;
    const { data, error } = await this.supabase.client.storage
      .from(FISH_IMAGE_BUCKET)
      .createSignedUrl(path, 60 * 60);

    if (error) {
      throw new InternalServerErrorException(`Could not create fish image URL: ${error.message}`);
    }
    return data.signedUrl;
  }

  async uploadImage(fishId: string, file: UploadedFishImage | undefined, role: FishImageRole = 'fish') {
    if (!file) throw new BadRequestException('กรุณาเลือกรูปปลา');
    if (file.size < 1 || file.size > FISH_IMAGE_MAX_BYTES) {
      throw new BadRequestException('รูปปลาต้องมีขนาดไม่เกิน 5 MB');
    }
    const extension = this.getImageExtension(file);

    const imagePathColumn = IMAGE_PATH_COLUMNS[role];
    const { data: fish, error: fishError } = await this.supabase.client
      .from('fish')
      .select(`id, ${imagePathColumn}`)
      .eq('id', fishId)
      .maybeSingle();

    if (fishError) {
      throw new InternalServerErrorException(`Could not load fish for image upload: ${fishError.message}`);
    }
    if (!fish) throw new NotFoundException('ไม่พบข้อมูลปลานี้');

    const imagePath = role === 'fish'
      ? `fish/${fishId}/${randomUUID()}.${extension}`
      : `fish/${fishId}/parents/${role}-${randomUUID()}.${extension}`;
    const { error: uploadError } = await this.supabase.client.storage
      .from(FISH_IMAGE_BUCKET)
      .upload(imagePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new InternalServerErrorException(`Could not upload fish image: ${uploadError.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } = await this.supabase.client.storage
      .from(FISH_IMAGE_BUCKET)
      .createSignedUrl(imagePath, 60 * 60);

    if (signedUrlError) {
      await this.supabase.client.storage.from(FISH_IMAGE_BUCKET).remove([imagePath]);
      throw new InternalServerErrorException(`Could not create fish image URL: ${signedUrlError.message}`);
    }

    const { error: updateError } = await this.supabase.client
      .from('fish')
      .update({ [imagePathColumn]: imagePath })
      .eq('id', fishId);

    if (updateError) {
      await this.supabase.client.storage.from(FISH_IMAGE_BUCKET).remove([imagePath]);
      throw new InternalServerErrorException(`Could not save fish image path: ${updateError.message}`);
    }

    const previousImagePath = (fish as unknown as Record<typeof imagePathColumn, string | null>)[imagePathColumn];
    if (previousImagePath) {
      await this.supabase.client.storage.from(FISH_IMAGE_BUCKET).remove([previousImagePath]);
    }

    return { imagePath, imageUrl: signedUrlData.signedUrl };
  }

  private async validateParent(parentId: string | undefined, expectedSex: 'male' | 'female') {
    if (!parentId) return;

    const { data, error } = await this.supabase.client
      .from('fish')
      .select('id, sex')
      .eq('id', parentId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Could not validate parent fish: ${error.message}`);
    }
    if (!data) throw new BadRequestException('ไม่พบปลาที่เลือกเป็นพ่อหรือแม่ในระบบ');
    if (data.sex !== expectedSex) {
      throw new BadRequestException(`ปลาที่เลือกเป็น${expectedSex === 'male' ? 'พ่อ' : 'แม่'}มีเพศไม่ถูกต้อง`);
    }
  }

  async findQrDetails(id: string) {
    const { data, error } = await this.supabase.client
      .from('fish')
      .select('id, code, name, sex, line_name, hatch_date, generation, father_id, mother_id, father_label, father_line, mother_label, mother_line, image_path, father_image_path, mother_image_path')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Could not load fish QR details: ${error.message}`);
    }
    if (!data) throw new NotFoundException('ไม่พบข้อมูลปลานี้');

    const fish = data as FishRow;
    const parentIds = [fish.father_id, fish.mother_id].filter((parentId): parentId is string => parentId !== null);
    const parentsById = new Map<string, FishRelation>();

    if (parentIds.length > 0) {
      const { data: parents, error: parentError } = await this.supabase.client
        .from('fish')
        .select('id, code, name, line_name, hatch_date, generation, father_id, mother_id, image_path')
        .in('id', parentIds);

      if (parentError) {
        throw new InternalServerErrorException(`Could not load fish parents: ${parentError.message}`);
      }

      for (const parent of parents ?? []) {
        parentsById.set(parent.id, parent);
      }
    }

    const father = fish.father_id ? parentsById.get(fish.father_id) : undefined;
    const mother = fish.mother_id ? parentsById.get(fish.mother_id) : undefined;

    return {
      id: fish.id,
      code: fish.code,
      name: fish.name,
      sex: fish.sex === 'male' ? 'ผู้' : fish.sex === 'female' ? 'เมีย' : 'ไม่ทราบ',
      line: fish.line_name,
      age: getAgeLabel(fish.hatch_date),
      imageUrl: await this.getSignedImageUrl(fish.image_path),
      generation: fish.generation,
      father: father
        ? { code: father.code, name: father.name, line: father.line_name, age: getAgeLabel(father.hatch_date), imageUrl: await this.getSignedImageUrl(father.image_path) }
        : { name: fish.father_label, line: fish.father_line, age: 'ไม่ระบุ', imageUrl: await this.getSignedImageUrl(fish.father_image_path) },
      mother: mother
        ? { code: mother.code, name: mother.name, line: mother.line_name, age: getAgeLabel(mother.hatch_date), imageUrl: await this.getSignedImageUrl(mother.image_path) }
        : { name: fish.mother_label, line: fish.mother_line, age: 'ไม่ระบุ', imageUrl: await this.getSignedImageUrl(fish.mother_image_path) },
    };
  }

  async findAll() {
    const { data, error } = await this.supabase.client
      .from('fish')
      .select(
        'id, code, name, sex, line_name, hatch_date, generation, father_id, mother_id, father_label, father_line, mother_label, mother_line, image_path, father_image_path, mother_image_path, created_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Could not load fish: ${error.message}`);
    }

    const rows = data as FishRow[];
    const fishById = new Map(rows.map((fish) => [fish.id, fish]));
    const imagePaths = [...new Set(rows.flatMap((fish) => [
      fish.image_path,
      fish.father_image_path,
      fish.mother_image_path,
    ]).filter((path): path is string => Boolean(path)))];
    const imageUrls = new Map<string, string>();

    if (imagePaths.length > 0) {
      const { data: signedUrls, error: signedUrlsError } = await this.supabase.client.storage
        .from(FISH_IMAGE_BUCKET)
        .createSignedUrls(imagePaths, 60 * 60);

      if (signedUrlsError) {
        throw new InternalServerErrorException(`Could not load fish image URLs: ${signedUrlsError.message}`);
      }

      imagePaths.forEach((path, index) => {
        const signedUrl = signedUrls?.[index]?.signedUrl;
        if (signedUrl) imageUrls.set(path, signedUrl);
      });
    }

    return rows.map((fish, index) => {
      const father = toParent(
        fish.father_id,
        fish.father_label,
        fish.father_line,
        fishById,
        fish.father_image_path,
        imageUrls,
      );
      const mother = toParent(
        fish.mother_id,
        fish.mother_label,
        fish.mother_line,
        fishById,
        fish.mother_image_path,
        imageUrls,
      );

      return {
        recordId: fish.id,
        id: fish.code,
        imageUrl: fish.image_path ? imageUrls.get(fish.image_path) ?? null : null,
        name: fish.name,
        strain: fish.line_name ?? 'ไม่ระบุสาย',
        sex: fish.sex === 'male' ? 'ผู้' : fish.sex === 'female' ? 'เมีย' : 'ไม่ระบุ',
        parents: `${father.id} / ${mother.id}`,
        age: getAgeLabel(fish.hatch_date),
        generation: fish.generation ?? 1,
        color: ['cyan', 'amber', 'emerald', 'rose'][index % 4],
        father,
        mother,
        lineage: '',
      };
    });
  }

  async create(input: CreateFishDto) {
    await this.validateParent(input.fatherId, 'male');
    await this.validateParent(input.motherId, 'female');

    const { data, error } = await this.supabase.client
      .from('fish')
      .insert({
        code: input.code.trim(),
        name: input.name.trim(),
        sex: input.sex,
        line_name: input.lineName?.trim() || null,
        hatch_date: input.hatchDate ?? null,
        pond_id: input.pondId ?? null,
        father_id: input.fatherId ?? null,
        mother_id: input.motherId ?? null,
        father_label: input.fatherId ? null : input.fatherLabel?.trim() || null,
        father_line: input.fatherId ? null : input.fatherLine?.trim() || null,
        mother_label: input.motherId ? null : input.motherLabel?.trim() || null,
        mother_line: input.motherId ? null : input.motherLine?.trim() || null,
        generation: input.generation ?? null,
        notes: input.notes?.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(`Could not create fish: ${error.message}`);
    }
    return data;
  }
}