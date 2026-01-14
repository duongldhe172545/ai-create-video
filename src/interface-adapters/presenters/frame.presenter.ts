import { Frame } from '../../entities/models/frame.model';

export class FramePresenter {
    present(frame: Frame) {
        return {
            frameNumber: frame.frameNumber,
            cameraAngle: frame.cameraAngle,
            action: frame.action,
            environment: frame.environment,
            lighting: frame.lighting,
            sound: frame.sound,
            hook: frame.hook,
            onScreenText: frame.onScreenText,
            voiceover: frame.voiceover,
            cta: frame.cta,
            durationSec: frame.durationSec,
            aspectRatio: frame.aspectRatio,
            imageUrl: frame.imageUrl,
            videoUrl: frame.videoUrl,
            isGenerating: frame.isGenerating,
            imageProgress: frame.imageProgress,
            isGeneratingVideo: frame.isGeneratingVideo,
            videoProgress: frame.videoProgress,
        };
    }

    presentList(frames: Frame[]) {
        return frames.map(frame => this.present(frame));
    }
}
