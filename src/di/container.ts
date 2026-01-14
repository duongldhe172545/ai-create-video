import { TYPES } from './types';

// Infrastructure
import { GeminiAIService } from '../infrastructure/repositories/gemini-ai.service';
import { OpenAIConsultantService } from '../infrastructure/repositories/openai-consultant.service';

// Use Cases
import { ParseScriptUseCase } from '../application/use-cases/parse-script.use-case';
import { GenerateScriptUseCase } from '../application/use-cases/generate-script.use-case';
import { GenerateFrameImageUseCase } from '../application/use-cases/generate-frame-image.use-case';
import { GenerateVideoUseCase } from '../application/use-cases/generate-video.use-case';
import { ConsultIdeaUseCase } from '../application/use-cases/consult-idea.use-case';

// Controllers
import { CampaignController } from '../interface-adapters/controllers/campaign.controller';
import { FrameController } from '../interface-adapters/controllers/frame.controller';
import { IConsultantService } from '../application/repositories/consultant-service.interface';

// Presenters
import { FramePresenter } from '../interface-adapters/presenters/frame.presenter';
import { ErrorPresenter } from '../interface-adapters/presenters/error.presenter';

// Simple Manual DI Container
export class Container {
    private instances = new Map<symbol, any>();

    constructor(private apiKey: string) {
        this.registerDependencies();
    }

    private registerDependencies() {
        // 1. Infrastructure
        const aiService = new GeminiAIService(this.apiKey);
        this.instances.set(TYPES.AIService, aiService);

        const consultantService = new OpenAIConsultantService();
        this.instances.set(TYPES.ConsultantService, consultantService);

        // 2. Use Cases
        const parseScriptUseCase = new ParseScriptUseCase(aiService);
        this.instances.set(TYPES.ParseScriptUseCase, parseScriptUseCase);

        const generateScriptUseCase = new GenerateScriptUseCase(consultantService);
        this.instances.set(TYPES.GenerateScriptUseCase, generateScriptUseCase);

        const generateFrameImageUseCase = new GenerateFrameImageUseCase(aiService);
        this.instances.set(TYPES.GenerateFrameImageUseCase, generateFrameImageUseCase);

        const generateVideoUseCase = new GenerateVideoUseCase(aiService);
        this.instances.set(TYPES.GenerateVideoUseCase, generateVideoUseCase);

        const consultIdeaUseCase = new ConsultIdeaUseCase(consultantService);
        this.instances.set(TYPES.ConsultIdeaUseCase, consultIdeaUseCase);

        // 3. Presenters (Singleton usually fine)
        const framePresenter = new FramePresenter();
        this.instances.set(TYPES.FramePresenter, framePresenter);

        const errorPresenter = new ErrorPresenter();
        this.instances.set(TYPES.ErrorPresenter, errorPresenter);

        // 4. Controllers
        const campaignController = new CampaignController(
            parseScriptUseCase,
            generateScriptUseCase,
            framePresenter,
            errorPresenter
        );
        this.instances.set(TYPES.CampaignController, campaignController);

        const frameController = new FrameController(
            generateFrameImageUseCase,
            generateVideoUseCase,
            framePresenter,
            errorPresenter
        );
        this.instances.set(TYPES.FrameController, frameController);
    }

    public get<T>(key: symbol): T {
        const instance = this.instances.get(key);
        if (!instance) {
            throw new Error(`Dependency not found: ${key.toString()}`);
        }
        return instance as T;
    }
}

export function createContainer(apiKey: string) {
    return new Container(apiKey);
}
