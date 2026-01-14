export class ImageGenerationError extends Error {
    constructor(public frameNumber: number, cause?: string) {
        super(`Failed to generate image for frame ${frameNumber}${cause ? `: ${cause}` : ''}`);
        this.name = 'ImageGenerationError';
    }
}

export class VideoGenerationError extends Error {
    constructor(public frameNumber: number, cause?: string) {
        super(`Failed to generate video for frame ${frameNumber}${cause ? `: ${cause}` : ''}`);
        this.name = 'VideoGenerationError';
    }
}

export class ScriptParsingError extends Error {
    constructor(cause?: string) {
        super(`Failed to parse script${cause ? `: ${cause}` : ''}`);
        this.name = 'ScriptParsingError';
    }
}
