import { Frame } from '../../entities/models/frame.model';
import { ReferenceAsset } from '../../entities/models/reference-asset.model';

export interface IAIService {
    parseScriptIntoFrames(script: string, targetDurationSec: number): Promise<Frame[]>;

    generateFrameImage(
        frame: Frame,
        characterBase64: string,
        referenceAssets: ReferenceAsset[]
    ): Promise<string>;

    generateVideo(
        frame: Frame,
        onProgress: (msg: string) => void
    ): Promise<string>;
}
