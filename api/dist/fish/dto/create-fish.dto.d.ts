export declare class CreateFishDto {
    code: string;
    name: string;
    sex: 'male' | 'female' | 'unknown';
    lineName?: string;
    hatchDate?: string;
    pondId?: string;
    fatherId?: string;
    motherId?: string;
    fatherLabel?: string;
    fatherLine?: string;
    motherLabel?: string;
    motherLine?: string;
    generation?: number;
    notes?: string;
}
