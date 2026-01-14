import { ParseScriptUseCase } from '../../application/use-cases/parse-script.use-case';
import { GenerateScriptUseCase } from '../../application/use-cases/generate-script.use-case';
import { FramePresenter } from '../presenters/frame.presenter';
import { ErrorPresenter } from '../presenters/error.presenter';
import { ScriptRequest } from '../../entities/models/script-request.model';

export class CampaignController {
    constructor(
        private parseScriptUseCase: ParseScriptUseCase,
        private generateScriptUseCase: GenerateScriptUseCase,
        private framePresenter: FramePresenter,
        private errorPresenter: ErrorPresenter
    ) { }

    async parseScript(script: string, targetDurationSec: number): Promise<{
        success: boolean;
        data?: any[];
        error?: string;
    }> {
        try {
            const frames = await this.parseScriptUseCase.execute(script, targetDurationSec);

            return {
                success: true,
                data: this.framePresenter.presentList(frames),
            };

        } catch (error) {
            return {
                success: false,
                error: this.errorPresenter.present(error),
            };
        }
    }

    async generateScript(request: ScriptRequest, apiKey: string): Promise<{
        success: boolean;
        data?: string;
        error?: string;
    }> {
        try {
            const script = await this.generateScriptUseCase.execute(request, apiKey);
            return { success: true, data: script };
        } catch (error) {
            return { success: false, error: this.errorPresenter.present(error) };
        }
    }
}
