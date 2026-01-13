
export interface FrameData {
  frameNumber: number;
  cameraAngle: string;
  action: string;
  environment: string;
  lighting: string;
  sound?: string;

  // Social video content fields (minimal pivot)
  hook?: string;
  onScreenText?: string;
  voiceover?: string;
  cta?: string;
  durationSec?: number;
  aspectRatio?: '9:16' | '16:9';

  imageUrl?: string;
  videoUrl?: string;
  isGenerating?: boolean;
  imageProgress?: number;
  isGeneratingVideo?: boolean;
  videoProgress?: string;
}

export interface ReferenceAsset {
  id: string;
  image: string; // data URL (base64)
  caption: string;
}

export interface ContentState {
  characterImage: string | null;
  referenceAssets: ReferenceAsset[];
  targetDurationSec: number;
  script: string;
  frames: FrameData[];
  isProcessingScript: boolean;
}
