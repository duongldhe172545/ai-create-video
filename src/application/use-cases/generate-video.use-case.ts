import { Frame } from '../../entities/models/frame.model';
import { IAIService } from '../repositories/ai-service.interface';
import { VideoGenerationError } from '../../entities/errors/generation-errors';

export class GenerateVideoUseCase {
    constructor(private aiService: IAIService) { }

    async execute(
        frame: Frame,
        onProgress: (msg: string) => void
    ): Promise<string> {
        if (!frame.imageUrl) {
            throw new VideoGenerationError(frame.frameNumber, 'Frame must have an image before generating video');
        }

        try {
            const videoUrl = await this.aiService.generateVideo(
                frame,
                onProgress
            );

            return videoUrl;
        } catch (error) {
            throw new VideoGenerationError(
                frame.frameNumber,
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}
