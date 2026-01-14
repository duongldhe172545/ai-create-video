import { describe, it, expect, vi } from 'vitest';
import { ParseScriptUseCase } from '../../../../src/application/use-cases/parse-script.use-case';
import { IAIService } from '../../../../src/application/repositories/ai-service.interface';
import { Frame } from '../../../../src/entities/models/frame.model';

// Mock IAIService
const mockAIService = {
    parseScriptIntoFrames: vi.fn(),
    generateFrameImage: vi.fn(),
    generateVideo: vi.fn(),
} as unknown as IAIService;

describe('ParseScriptUseCase', () => {
    it('should parse script successfully', async () => {
        // Arrange
        const useCase = new ParseScriptUseCase(mockAIService);
        const mockFrames: Frame[] = [
            {
                frameNumber: 1,
                cameraAngle: 'Wide',
                action: 'Scene 1',
                environment: 'Indoor',
                lighting: 'Bright',
                durationSec: 8,
                aspectRatio: '9:16',
            }
        ];

        vi.spyOn(mockAIService, 'parseScriptIntoFrames').mockResolvedValue(mockFrames);

        // Act
        const result = await useCase.execute('Test script', 30);

        // Assert
        expect(result).toEqual(mockFrames);
        expect(mockAIService.parseScriptIntoFrames).toHaveBeenCalledWith('Test script', 30);
    });

    it('should throw error for empty script', async () => {
        const useCase = new ParseScriptUseCase(mockAIService);
        await expect(useCase.execute('', 30)).rejects.toThrow('Script cannot be empty');
    });

    it('should throw error for invalid duration', async () => {
        const useCase = new ParseScriptUseCase(mockAIService);
        await expect(useCase.execute('Script', 5)).rejects.toThrow('Target duration must be between 8 and 120 seconds');
    });
});
