import { Frame } from '../../entities/models/frame.model';
import { IAIService } from '../repositories/ai-service.interface';
import { ScriptParsingError } from '../../entities/errors/generation-errors';

export class ParseScriptUseCase {
    constructor(private aiService: IAIService) { }

    async execute(script: string, targetDurationSec: number): Promise<Frame[]> {
        if (!script || script.trim().length === 0) {
            throw new ScriptParsingError('Script cannot be empty');
        }

        if (targetDurationSec < 8 || targetDurationSec > 120) {
            throw new ScriptParsingError('Target duration must be between 8 and 120 seconds');
        }

        try {
            const frames = await this.aiService.parseScriptIntoFrames(script, targetDurationSec);
            return frames;
        } catch (error) {
            if (error instanceof ScriptParsingError) {
                throw error;
            }
            throw new ScriptParsingError(error instanceof Error ? error.message : 'Unknown error');
        }
    }
}
