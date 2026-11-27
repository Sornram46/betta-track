import { CreateFishDto } from './dto/create-fish.dto';
import { FishService } from './fish.service';
interface FishImageUpload {
    buffer: Buffer;
    mimetype: string;
    size: number;
}
export declare class FishController {
    private readonly fishService;
    constructor(fishService: FishService);
    findAll(): Promise<{
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
    create(createFishDto: CreateFishDto): Promise<any>;
    findOne(id: string): Promise<{
        imageUrl: string | null;
        fatherImageUrl: string | null;
        motherImageUrl: string | null;
        id: any;
        code: any;
        name: any;
        sex: any;
        line_name: any;
        hatch_date: any;
        generation: any;
        father_id: any;
        mother_id: any;
        father_label: any;
        father_line: any;
        mother_label: any;
        mother_line: any;
        notes: any;
    }>;
    update(id: string, updateFishDto: CreateFishDto): Promise<{
        id: any;
        code: any;
        name: any;
    }>;
    remove(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    uploadImage(id: string, image: FishImageUpload | undefined, role: string | undefined): Promise<{
        imagePath: string;
        imageUrl: string;
    }>;
}
export {};
