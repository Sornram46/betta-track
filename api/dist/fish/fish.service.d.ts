import { SupabaseService } from '../supabase/supabase.service';
import { CreateFishDto } from './dto/create-fish.dto';
type FishImageRole = 'fish' | 'father' | 'mother';
interface UploadedFishImage {
    buffer: Buffer;
    mimetype: string;
    size: number;
}
export declare class FishService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    private getImageExtension;
    private getSignedImageUrl;
    uploadImage(fishId: string, file: UploadedFishImage | undefined, role?: FishImageRole): Promise<{
        imagePath: string;
        imageUrl: string;
    }>;
    private validateParent;
    findQrDetails(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        sex: string;
        line: string | null;
        age: string;
        imageUrl: string | null;
        generation: number | null;
        father: {
            code: string;
            name: string;
            line: string | null;
            age: string;
            imageUrl: string | null;
        } | {
            name: string | null;
            line: string | null;
            age: string;
            imageUrl: string | null;
            code?: undefined;
        };
        mother: {
            code: string;
            name: string;
            line: string | null;
            age: string;
            imageUrl: string | null;
        } | {
            name: string | null;
            line: string | null;
            age: string;
            imageUrl: string | null;
            code?: undefined;
        };
    }>;
    findAll(ownerId?: string): Promise<{
        recordId: string;
        id: string;
        imageUrl: string | null;
        name: string;
        strain: string;
        sex: string;
        parents: string;
        age: string;
        generation: number;
        color: string;
        father: {
            id: string;
            name: string;
            age: string;
            generation: number | undefined;
            imageUrl: string | null;
            parents: {
                father: {
                    id: string;
                    name: string;
                    age: string;
                    imageUrl: string | null;
                };
                mother: {
                    id: string;
                    name: string;
                    age: string;
                    imageUrl: string | null;
                };
            };
            line: string | null;
        };
        mother: {
            id: string;
            name: string;
            age: string;
            generation: number | undefined;
            imageUrl: string | null;
            parents: {
                father: {
                    id: string;
                    name: string;
                    age: string;
                    imageUrl: string | null;
                };
                mother: {
                    id: string;
                    name: string;
                    age: string;
                    imageUrl: string | null;
                };
            };
            line: string | null;
        };
        lineage: string;
    }[]>;
    create(input: CreateFishDto): Promise<any>;
}
export {};
