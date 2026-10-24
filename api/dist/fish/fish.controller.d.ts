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
    uploadImage(id: string, image: FishImageUpload | undefined, role: string | undefined): Promise<{
        imagePath: string;
        imageUrl: string;
    }>;
}
export {};
