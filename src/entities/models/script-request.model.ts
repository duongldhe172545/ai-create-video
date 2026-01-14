import { z } from 'zod';

export const scriptRequestSchema = z.object({
    topic: z.string().min(1, 'Topic/Idea is required'),
    tone: z.string().optional(),
    market: z.string().optional(),
    language: z.string().optional(),
    targetAudience: z.string().optional(),
});

export type ScriptRequest = z.infer<typeof scriptRequestSchema>;

export class ScriptRequestModel {
    static validate(data: unknown): ScriptRequest {
        return scriptRequestSchema.parse(data);
    }
}
