import { OpenAIConsultantService } from '../infrastructure/repositories/openai-consultant.service';
import { ScriptRequest } from '../../entities/models/script-request.model';

export class GenerateScriptUseCase {
    constructor(private aiService: OpenAIConsultantService) { }

    async execute(request: ScriptRequest, apiKey: string): Promise<string> {
        // Validate request
        if (!request.topic) {
            throw new Error("Topic is required");
        }
        if (!apiKey) {
            throw new Error("OpenAI API Key is required");
        }

        return this.aiService.generateScript(request, apiKey);
    }
}
