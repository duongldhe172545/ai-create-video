import { GenerateFrameImageUseCase } from '../../application/use-cases/generate-frame-image.use-case';
import { GenerateVideoUseCase } from '../../application/use-cases/generate-video.use-case';
import { FramePresenter } from '../presenters/frame.presenter';
import { ErrorPresenter } from '../presenters/error.presenter';
import { CharacterModel } from '../../entities/models/character.model';
import { ReferenceAssetModel } from '../../entities/models/reference-asset.model';

export class FrameController {
    constructor(
        private generateFrameImageUseCase: GenerateFrameImageUseCase,
        private generateVideoUseCase: GenerateVideoUseCase,
        private framePresenter: FramePresenter,
        private errorPresenter: ErrorPresenter
    ) { }

    async generateImage(
        frame: any, // In controller we accept raw/any and validate/map
        character: any,
        referenceAssets: any[]
    ): Promise<{ success: boolean; data?: string; error?: string }> {
        try {
            // Basic runtime conversion/validation if needed, or rely on Use Case validation
            const validCharacter = CharacterModel.validate(character);
            const validAssets = ReferenceAssetModel.validateArray(referenceAssets);
            // Frame needs to be mapped back to Entity if it came from UI state, 
            // but here we just pass it as is assuming it matches shape or UseCase handles it?
            // Actually Use Case expects Frame entity.
            // In real app, we might construct Frame entity from ID or pass full object.
            // For now, pass as is (casting inside Use Case or here).

            const imageUrl = await this.generateFrameImageUseCase.execute(
                frame,
                validCharacter,
                validAssets
            );

            return { success: true, data: imageUrl };
        } catch (error) {
            return { success: false, error: this.errorPresenter.present(error) };
        }
    }

    async generateVideo(
        frame: any,
        onProgress: (msg: string) => void
    ): Promise<{ success: boolean; data?: string; error?: string }> {
        try {
            const videoUrl = await this.generateVideoUseCase.execute(frame, onProgress);
            return { success: true, data: videoUrl };
        } catch (error) {
            return { success: false, error: this.errorPresenter.present(error) };
        }
    }
}
