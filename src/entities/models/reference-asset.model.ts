import { z } from 'zod';

export const referenceAssetSchema = z.object({
    id: z.string().uuid().or(z.string()),
    image: z.string().min(1, "Image data required"), // base64 or url
    caption: z.string().optional(),
});

export type ReferenceAsset = z.infer<typeof referenceAssetSchema>;

export class ReferenceAssetModel {
    static validate(data: unknown): ReferenceAsset {
        return referenceAssetSchema.parse(data);
    }

    static validateArray(data: unknown[]): ReferenceAsset[] {
        return data.map(item => referenceAssetSchema.parse(item));
    }
}
