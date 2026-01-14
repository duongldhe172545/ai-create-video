import { ParseScriptUseCase } from '../../application/use-cases/parse-script.use-case';
import { FramePresenter } from '../presenters/frame.presenter';
import { ErrorPresenter } from '../presenters/error.presenter';

export class CampaignController {
    constructor(
        private parseScriptUseCase: ParseScriptUseCase,
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
}
