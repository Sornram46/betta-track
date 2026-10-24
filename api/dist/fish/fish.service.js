"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const supabase_service_1 = require("../supabase/supabase.service");
const FISH_IMAGE_BUCKET = 'fish-images';
const FISH_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_PATH_COLUMNS = {
    fish: 'image_path',
    father: 'father_image_path',
    mother: 'mother_image_path',
};
function getAgeLabel(hatchDate) {
    if (!hatchDate)
        return 'ไม่ระบุ';
    const born = new Date(`${hatchDate}T00:00:00Z`);
    const now = new Date();
    let years = now.getUTCFullYear() - born.getUTCFullYear();
    let months = now.getUTCMonth() - born.getUTCMonth();
    const days = now.getUTCDate() - born.getUTCDate();
    if (days < 0)
        months -= 1;
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    if (years < 0)
        return '0 วัน';
    if (years === 0 && months === 0) {
        const ageInDays = Math.max(0, Math.floor((now.getTime() - born.getTime()) / 86_400_000));
        return `${ageInDays} วัน`;
    }
    return [years ? `${years} ปี` : '', months ? `${months} เดือน` : '']
        .filter(Boolean)
        .join(' ');
}
function toAncestor(fish, imageUrls) {
    const imageUrl = fish?.image_path ? imageUrls.get(fish.image_path) ?? null : null;
    return {
        id: fish?.code ?? '-',
        name: fish?.name ?? 'ยังไม่มีข้อมูล',
        age: getAgeLabel(fish?.hatch_date ?? null),
        imageUrl,
    };
}
function toParent(parentId, label, line, fishById, fallbackImagePath, imageUrls) {
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
let FishService = class FishService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    getImageExtension(file) {
        const bytes = file.buffer;
        if (file.mimetype === 'image/jpeg' &&
            bytes.length >= 3 &&
            bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
            return 'jpg';
        if (file.mimetype === 'image/png' &&
            bytes.length >= 8 &&
            bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
            return 'png';
        if (file.mimetype === 'image/webp' &&
            bytes.length >= 12 &&
            bytes.toString('ascii', 0, 4) === 'RIFF' &&
            bytes.toString('ascii', 8, 12) === 'WEBP')
            return 'webp';
        throw new common_1.BadRequestException('รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP ที่ถูกต้อง');
    }
    async getSignedImageUrl(path) {
        if (!path)
            return null;
        const { data, error } = await this.supabase.client.storage
            .from(FISH_IMAGE_BUCKET)
            .createSignedUrl(path, 60 * 60);
        if (error) {
            throw new common_1.InternalServerErrorException(`Could not create fish image URL: ${error.message}`);
        }
        return data.signedUrl;
    }
    async uploadImage(fishId, file, role = 'fish') {
        if (!file)
            throw new common_1.BadRequestException('กรุณาเลือกรูปปลา');
        if (file.size < 1 || file.size > FISH_IMAGE_MAX_BYTES) {
            throw new common_1.BadRequestException('รูปปลาต้องมีขนาดไม่เกิน 5 MB');
        }
        const extension = this.getImageExtension(file);
        const imagePathColumn = IMAGE_PATH_COLUMNS[role];
        const { data: fish, error: fishError } = await this.supabase.client
            .from('fish')
            .select(`id, ${imagePathColumn}`)
            .eq('id', fishId)
            .maybeSingle();
        if (fishError) {
            throw new common_1.InternalServerErrorException(`Could not load fish for image upload: ${fishError.message}`);
        }
        if (!fish)
            throw new common_1.NotFoundException('ไม่พบข้อมูลปลานี้');
        const imagePath = role === 'fish'
            ? `fish/${fishId}/${(0, node_crypto_1.randomUUID)()}.${extension}`
            : `fish/${fishId}/parents/${role}-${(0, node_crypto_1.randomUUID)()}.${extension}`;
        const { error: uploadError } = await this.supabase.client.storage
            .from(FISH_IMAGE_BUCKET)
            .upload(imagePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false,
        });
        if (uploadError) {
            throw new common_1.InternalServerErrorException(`Could not upload fish image: ${uploadError.message}`);
        }
        const { data: signedUrlData, error: signedUrlError } = await this.supabase.client.storage
            .from(FISH_IMAGE_BUCKET)
            .createSignedUrl(imagePath, 60 * 60);
        if (signedUrlError) {
            await this.supabase.client.storage.from(FISH_IMAGE_BUCKET).remove([imagePath]);
            throw new common_1.InternalServerErrorException(`Could not create fish image URL: ${signedUrlError.message}`);
        }
        const { error: updateError } = await this.supabase.client
            .from('fish')
            .update({ [imagePathColumn]: imagePath })
            .eq('id', fishId);
        if (updateError) {
            await this.supabase.client.storage.from(FISH_IMAGE_BUCKET).remove([imagePath]);
            throw new common_1.InternalServerErrorException(`Could not save fish image path: ${updateError.message}`);
        }
        const previousImagePath = fish[imagePathColumn];
        if (previousImagePath) {
            await this.supabase.client.storage.from(FISH_IMAGE_BUCKET).remove([previousImagePath]);
        }
        return { imagePath, imageUrl: signedUrlData.signedUrl };
    }
    async validateParent(parentId, expectedSex) {
        if (!parentId)
            return;
        const { data, error } = await this.supabase.client
            .from('fish')
            .select('id, sex')
            .eq('id', parentId)
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException(`Could not validate parent fish: ${error.message}`);
        }
        if (!data)
            throw new common_1.BadRequestException('ไม่พบปลาที่เลือกเป็นพ่อหรือแม่ในระบบ');
        if (data.sex !== expectedSex) {
            throw new common_1.BadRequestException(`ปลาที่เลือกเป็น${expectedSex === 'male' ? 'พ่อ' : 'แม่'}มีเพศไม่ถูกต้อง`);
        }
    }
    async findQrDetails(id) {
        const { data, error } = await this.supabase.client
            .from('fish')
            .select('id, code, name, sex, line_name, hatch_date, generation, father_id, mother_id, father_label, father_line, mother_label, mother_line, image_path, father_image_path, mother_image_path')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            throw new common_1.InternalServerErrorException(`Could not load fish QR details: ${error.message}`);
        }
        if (!data)
            throw new common_1.NotFoundException('ไม่พบข้อมูลปลานี้');
        const fish = data;
        const parentIds = [fish.father_id, fish.mother_id].filter((parentId) => parentId !== null);
        const parentsById = new Map();
        if (parentIds.length > 0) {
            const { data: parents, error: parentError } = await this.supabase.client
                .from('fish')
                .select('id, code, name, line_name, hatch_date, generation, father_id, mother_id, image_path')
                .in('id', parentIds);
            if (parentError) {
                throw new common_1.InternalServerErrorException(`Could not load fish parents: ${parentError.message}`);
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
            .select('id, code, name, sex, line_name, hatch_date, generation, father_id, mother_id, father_label, father_line, mother_label, mother_line, image_path, father_image_path, mother_image_path, created_at')
            .order('created_at', { ascending: false });
        if (error) {
            throw new common_1.InternalServerErrorException(`Could not load fish: ${error.message}`);
        }
        const rows = data;
        const fishById = new Map(rows.map((fish) => [fish.id, fish]));
        const imagePaths = [...new Set(rows.flatMap((fish) => [
                fish.image_path,
                fish.father_image_path,
                fish.mother_image_path,
            ]).filter((path) => Boolean(path)))];
        const imageUrls = new Map();
        if (imagePaths.length > 0) {
            const { data: signedUrls, error: signedUrlsError } = await this.supabase.client.storage
                .from(FISH_IMAGE_BUCKET)
                .createSignedUrls(imagePaths, 60 * 60);
            if (signedUrlsError) {
                throw new common_1.InternalServerErrorException(`Could not load fish image URLs: ${signedUrlsError.message}`);
            }
            imagePaths.forEach((path, index) => {
                const signedUrl = signedUrls?.[index]?.signedUrl;
                if (signedUrl)
                    imageUrls.set(path, signedUrl);
            });
        }
        return rows.map((fish, index) => {
            const father = toParent(fish.father_id, fish.father_label, fish.father_line, fishById, fish.father_image_path, imageUrls);
            const mother = toParent(fish.mother_id, fish.mother_label, fish.mother_line, fishById, fish.mother_image_path, imageUrls);
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
    async create(input) {
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
            throw new common_1.InternalServerErrorException(`Could not create fish: ${error.message}`);
        }
        return data;
    }
};
exports.FishService = FishService;
exports.FishService = FishService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], FishService);
//# sourceMappingURL=fish.service.js.map