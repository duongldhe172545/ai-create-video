import { z } from 'zod';

export const characterSchema = z.object({
    imageBase64: z.string().min(1, 'Character image is required'),
});

export type Character = z.infer<typeof characterSchema>;

export class CharacterModel {
    static validate(data: unknown): Character {
        return characterSchema.parse(data);
    }
}
