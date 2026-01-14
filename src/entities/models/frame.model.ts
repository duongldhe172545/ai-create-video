import { z } from 'zod';

export const frameSchema = z.object({
    frameNumber: z.number().int().positive(),
    cameraAngle: z.string().min(1, 'Camera angle is required'),
    action: z.string().min(5, 'Action description must be at least 5 characters'),
    environment: z.string().min(1, 'Environment is required'),
    lighting: z.string().min(1, 'Lighting is required'),
    sound: z.string().optional(),

    // Social video content fields
    hook: z.string().optional(),
    onScreenText: z.string().optional(),
    voiceover: z.string().optional(),
    cta: z.string().optional(),
    durationSec: z.number().int().min(1).max(120).default(8),
    aspectRatio: z.enum(['9:16', '16:9']).default('9:16'),

    // Generated content
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    isGenerating: z.boolean().optional(),
    imageProgress: z.number().min(0).max(100).optional(),
    isGeneratingVideo: z.boolean().optional(),
    videoProgress: z.string().optional(),
});

export type Frame = z.infer<typeof frameSchema>;

export class FrameModel {
    static validate(data: unknown): Frame {
        return frameSchema.parse(data);
    }

    static validateArray(data: unknown[]): Frame[] {
        return data.map(item => frameSchema.parse(item));
    }
}
