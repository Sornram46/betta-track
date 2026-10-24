import { FishService } from './fish.service';
export declare class FishQrController {
    private readonly fishService;
    constructor(fishService: FishService);
    findById(id: string): Promise<{
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
}
