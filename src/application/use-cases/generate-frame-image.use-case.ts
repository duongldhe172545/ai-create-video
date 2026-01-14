import { Frame } from '../../entities/models/frame.model';
import { Character } from '../../entities/models/character.model';
import { ReferenceAsset } from '../../entities/models/reference-asset.model';
import { IAIService } from '../repositories/ai-service.interface';
import { ImageGenerationError } from '../../entities/errors/generation-errors';

export class GenerateFrameImageUseCase {
    constructor(private aiService: IAIService) { }

    async execute(
        frame: Frame,
        character: Character,
        referenceAssets: ReferenceAsset[]
    ): Promise<string> {
        if (!character.imageBase64) {
            throw new ImageGenerationError(frame.frameNumber, 'Character image is required');
        }

        try {
            const imageUrl = await this.aiService.generateFrameImage(
                frame,
                character.imageBase64,
                referenceAssets
            );

            return imageUrl;
        } catch (error) {
            throw new ImageGenerationError(
                frame.frameNumber,
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}
