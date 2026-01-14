# Clean Architecture Refactoring Implementation Plan

## Mục Tiêu

Refactor ứng dụng React hiện tại sang Clean Architecture để đạt:
- ✅ Tách biệt business logic khỏi UI framework
- ✅ Testability cao (80%+ coverage)
- ✅ Dễ maintain và mở rộng
- ✅ Chuẩn doanh nghiệp (enterprise-grade)

---

## User Review Required

> [!IMPORTANT]
> **Chiến Lược Refactoring**
> 
> **Approach:** Incremental Refactoring (phân tách từng feature một)
> 
> **Ưu điểm:**
> - Không gián đoạn development
> - Deploy liên tục
> - Giảm rủi ro
> - Team có thể học dần
> 
> **Thời gian:** 1-2 tuần (30-40 giờ dev)
> 
> **Thứ tự ưu tiên:**
> 1. Foundation first (DI, folder structure)
> 2. Core entities và errors
> 3. Use cases (business logic)
> 4. Infrastructure (services)
> 5. Controllers
> 6. Refactor UI layer
> 7. Testing

> [!WARNING]
> **Breaking Changes**
> 
> Các thay đổi sau sẽ ảnh hưởng đến cấu trúc code:
> - Di chuyển business logic ra khỏi `App.tsx`
> - Refactor `geminiService.ts` thành interface + implementation
> - Thay đổi cách components nhận data (qua presenters)
> 
> **Backward Compatibility:** Sẽ đảm bảo features vẫn hoạt động như cũ

---

## Proposed Changes

### 📦 Phase 1: Foundation Setup

#### [NEW] Cài đặt dependencies

**Mục đích:** Thêm các thư viện cần thiết cho Clean Architecture

**Thay đổi:**
```json
// package.json
{
  "dependencies": {
    "@google/genai": "^1.35.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "zod": "^3.22.4",           // ➕ NEW: Validation
    "ioctopus": "^1.0.0"        // ➕ NEW: Dependency Injection
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "vitest": "^1.2.0",          // ➕ NEW: Testing
    "@vitest/ui": "^1.2.0",
    "eslint-plugin-boundaries": "^4.0.0"  // ➕ NEW: Enforce architecture
  }
}
```

#### [NEW] Cấu trúc thư mục Clean Architecture

```
src/
├── entities/                  # ➕ NEW - Entities Layer
│   ├── models/
│   │   ├── campaign.model.ts
│   │   ├── frame.model.ts
│   │   ├── character.model.ts
│   │   └── reference-asset.model.ts
│   ├── errors/
│   │   ├── api-errors.ts
│   │   ├── generation-errors.ts
│   │   └── validation-errors.ts
│   └── constants.ts
│
├── application/               # ➕ NEW - Application Layer
│   ├── use-cases/
│   │   ├── parse-script.use-case.ts
│   │   ├── generate-frame-image.use-case.ts
│   │   ├── generate-video.use-case.ts
│   │   └── process-all-frames.use-case.ts
│   ├── repositories/
│   │   └── ai-service.interface.ts
│   └── services/
│       └── storage-service.interface.ts
│
├── infrastructure/            # ➕ NEW - Infrastructure Layer
│   ├── repositories/
│   │   └── gemini-ai.service.ts
│   └── services/
│       └── local-storage.service.ts
│
├── interface-adapters/        # ➕ NEW - Interface Adapters Layer
│   ├── controllers/
│   │   ├── campaign.controller.ts
│   │   └── frame.controller.ts
│   └── presenters/
│       ├── frame.presenter.ts
│       └── error.presenter.ts
│
└── di/                        # ➕ NEW - Dependency Injection
    ├── container.ts
    ├── types.ts
    └── modules.ts
```

#### [NEW] ESLint configuration for boundaries

```json
// .eslintrc.json
{
  "extends": ["react-app"],
  "plugins": ["boundaries"],
  "settings": {
    "boundaries/elements": [
      { "type": "entities", "pattern": "src/entities/*" },
      { "type": "application", "pattern": "src/application/*" },
      { "type": "infrastructure", "pattern": "src/infrastructure/*" },
      { "type": "interface-adapters", "pattern": "src/interface-adapters/*" },
      { "type": "app", "pattern": "App.tsx" }
    ],
    "boundaries/rules": [
      {
        "target": "entities",
        "disallow": ["application", "infrastructure", "interface-adapters", "app"]
      },
      {
        "target": "application",
        "disallow": ["infrastructure", "interface-adapters", "app"]
      },
      {
        "target": "infrastructure",
        "disallow": ["interface-adapters", "app"]
      },
      {
        "target": "interface-adapters",
        "disallow": ["app"]
      }
    ]
  }
}
```

---

### 🎯 Phase 2: Entities Layer

#### [NEW] src/entities/models/frame.model.ts

**Mục đích:** Tạo domain model với validation

**Trước:**
```typescript
// types.ts
export interface FrameData {
  frameNumber: number;
  cameraAngle: string;
  action: string;
  // ... 18 fields, no validation
}
```

**Sau:**
```typescript
// src/entities/models/frame.model.ts
import { z } from 'zod';

export const frameSchema = z.object({
  frameNumber: z.number().int().positive(),
  cameraAngle: z.string().min(1, 'Camera angle is required'),
  action: z.string().min(5, 'Action description must be at least 5 characters'),
  environment: z.string().min(1, 'Environment is required'),
  lighting: z.string().min(1, 'Lighting is required'),
  sound: z.string().optional(),
  
  // Social video content fields
  hook: z.string().optional(),
  onScreenText: z.string().optional(),
  voiceover: z.string().optional(),
  cta: z.string().optional(),
  durationSec: z.number().int().min(5).max(8).default(8),
  aspectRatio: z.enum(['9:16', '16:9']).default('9:16'),
  
  // Generated content
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  isGenerating: z.boolean().optional(),
  imageProgress: z.number().min(0).max(100).optional(),
  isGeneratingVideo: z.boolean().optional(),
  videoProgress: z.string().optional(),
});

export type Frame = z.infer<typeof frameSchema>;

export class FrameModel {
  static validate(data: unknown): Frame {
    return frameSchema.parse(data);
  }
  
  static validateArray(data: unknown[]): Frame[] {
    return data.map(item => frameSchema.parse(item));
  }
}
```

#### [NEW] src/entities/errors/api-errors.ts

**Mục đích:** Custom error classes thay vì generic Error

```typescript
export class ApiKeyMissingError extends Error {
  constructor() {
    super('API key is missing');
    this.name = 'ApiKeyMissingError';
  }
}

export class ApiKeyInvalidError extends Error {
  constructor() {
    super('API key is invalid or expired');
    this.name = 'ApiKeyInvalidError';
  }
}

export class RateLimitError extends Error {
  constructor(retryAfter?: number) {
    super(`Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}s` : ''}`);
    this.name = 'RateLimitError';
  }
}
```

#### [NEW] src/entities/errors/generation-errors.ts

```typescript
export class ImageGenerationError extends Error {
  constructor(frameNumber: number, cause?: string) {
    super(`Failed to generate image for frame ${frameNumber}${cause ? `: ${cause}` : ''}`);
    this.name = 'ImageGenerationError';
  }
}

export class VideoGenerationError extends Error {
  constructor(frameNumber: number, cause?: string) {
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
```

---

### 🧠 Phase 3: Application Layer

#### [NEW] src/application/repositories/ai-service.interface.ts

**Mục đích:** Định nghĩa interface cho AI service

```typescript
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
```

#### [NEW] src/application/use-cases/parse-script.use-case.ts

**Mục đích:** Extract business logic từ App.tsx

**Trước (App.tsx):**
```typescript
const handleProcessScript = async () => {
  if (!state.script || state.isProcessingScript) return;
  if (!apiKey) {
    alert('Vui lòng nhập API key ở thanh trên cùng.');
    return;
  }

  setState(prev => ({ ...prev, isProcessingScript: true, frames: [] }));
  try {
    const frames = await gemini.parseScriptIntoFrames(state.script, state.targetDurationSec);
    setState(prev => ({ ...prev, frames, isProcessingScript: false }));
  } catch (error) {
    console.error(error);
    const msg = (error as any)?.message;
    if (msg === 'MISSING_API_KEY') alert('Thiếu API key. Vui lòng nhập lại.');
    else alert("Lỗi khi phân tích kịch bản. Vui lòng thử lại.");
    setState(prev => ({ ...prev, isProcessingScript: false }));
  }
};
```

**Sau:**
```typescript
// src/application/use-cases/parse-script.use-case.ts
import { Frame } from '../../entities/models/frame.model';
import { IAIService } from '../repositories/ai-service.interface';
import { ScriptParsingError } from '../../entities/errors/generation-errors';

export class ParseScriptUseCase {
  constructor(private aiService: IAIService) {}

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
```

#### [NEW] src/application/use-cases/generate-frame-image.use-case.ts

```typescript
import { Frame } from '../../entities/models/frame.model';
import { Character } from '../../entities/models/character.model';
import { ReferenceAsset } from '../../entities/models/reference-asset.model';
import { IAIService } from '../repositories/ai-service.interface';
import { ImageGenerationError } from '../../entities/errors/generation-errors';

export class GenerateFrameImageUseCase {
  constructor(private aiService: IAIService) {}

  async execute(
    frame: Frame,
    character: Character,
    referenceAssets: ReferenceAsset[]
  ): Promise<string> {
    if (!character.imageBase64) {
      throw new ImageGenerationError(frame.frameNumber, 'Character image is required');
    }

    try {
      const imageUrl = await this.aiService.generateFrameImage(
        frame,
        character.imageBase64,
        referenceAssets
      );
      
      return imageUrl;
    } catch (error) {
      throw new ImageGenerationError(
        frame.frameNumber,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
```

---

### 🔧 Phase 4: Infrastructure Layer

#### [MODIFY] services/geminiService.ts → src/infrastructure/repositories/gemini-ai.service.ts

**Mục đích:** Implement interface, convert errors

**Trước:**
```typescript
// services/geminiService.ts
export class GeminiService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = (apiKey || '').trim();
  }
  
  private getClient(): GoogleGenAI {
    if (!this.apiKey) {
      throw new Error('MISSING_API_KEY');
    }
    return new GoogleGenAI({ apiKey: this.apiKey });
  }
  
  async parseScriptIntoFrames(...) { /* 100 lines */ }
  async generateFrameImage(...) { /* 80 lines */ }
  async generateVideo(...) { /* 47 lines */ }
}
```

**Sau:**
```typescript
// src/infrastructure/repositories/gemini-ai.service.ts
import { GoogleGenAI } from '@google/genai';
import { IAIService } from '../../application/repositories/ai-service.interface';
import { Frame, FrameModel } from '../../entities/models/frame.model';
import { ReferenceAsset } from '../../entities/models/reference-asset.model';
import { ApiKeyMissingError, ApiKeyInvalidError } from '../../entities/errors/api-errors';
import { ScriptParsingError, ImageGenerationError, VideoGenerationError } from '../../entities/errors/generation-errors';

export class GeminiAIService implements IAIService {
  constructor(private apiKey: string) {}

  private getClient(): GoogleGenAI {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new ApiKeyMissingError();
    }
    return new GoogleGenAI({ apiKey: this.apiKey });
  }

  async parseScriptIntoFrames(script: string, targetDurationSec: number): Promise<Frame[]> {
    const ai = this.getClient();
    
    try {
      // ... existing logic
      const response = await ai.models.generateContent({ /* ... */ });
      const parsed = JSON.parse(response.text || '[]');
      
      // ✅ Validate with Zod
      return FrameModel.validateArray(parsed);
      
    } catch (error) {
      // ✅ Convert to custom errors
      if (error instanceof ApiKeyMissingError) throw error;
      if ((error as any)?.message?.includes('API key')) {
        throw new ApiKeyInvalidError();
      }
      throw new ScriptParsingError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async generateFrameImage(
    frame: Frame,
    characterBase64: string,
    referenceAssets: ReferenceAsset[]
  ): Promise<string> {
    const ai = this.getClient();
    
    try {
      // ... existing logic
      const response = await ai.models.generateContent({ /* ... */ });
      
      // Extract image URL
      const imageUrl = /* ... */;
      if (!imageUrl) {
        throw new ImageGenerationError(frame.frameNumber, 'No image URL in response');
      }
      
      return imageUrl;
      
    } catch (error) {
      if (error instanceof ImageGenerationError) throw error;
      if (error instanceof ApiKeyMissingError) throw error;
      throw new ImageGenerationError(frame.frameNumber, error instanceof Error ? error.message : 'Unknown');
    }
  }

  async generateVideo(frame: Frame, onProgress: (msg: string) => void): Promise<string> {
    const ai = this.getClient();
    
    try {
      // ... existing logic
      let operation = await ai.models.generateVideos({ /* ... */ });
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
        onProgress("Đang kết xuất clip...");
      }
      
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new VideoGenerationError(frame.frameNumber, 'No download link');
      }
      
      // Download video
      const response = await fetch(`${downloadLink}&key=${encodeURIComponent(this.apiKey)}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
      
    } catch (error) {
      if (error instanceof VideoGenerationError) throw error;
      if ((error as any)?.message?.includes('Requested entity was not found')) {
        throw new ApiKeyInvalidError();
      }
      throw new VideoGenerationError(frame.frameNumber, error instanceof Error ? error.message : 'Unknown');
    }
  }
}
```

---

### 🎮 Phase 5: Interface Adapters

#### [NEW] src/interface-adapters/controllers/campaign.controller.ts

**Mục đích:** Orchestrate use cases, handle errors

```typescript
import { ParseScriptUseCase } from '../../application/use-cases/parse-script.use-case';
import { Frame } from '../../entities/models/frame.model';
import { FramePresenter } from '../presenters/frame.presenter';
import { ErrorPresenter } from '../presenters/error.presenter';

export class CampaignController {
  constructor(
    private parseScriptUseCase: ParseScriptUseCase,
    private framePresenter: FramePresenter,
    private errorPresenter: ErrorPresenter
  ) {}

  async parseScript(script: string, targetDurationSec: number): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // Input validation (already done in use case, but can add extra checks)
      const frames = await this.parseScriptUseCase.execute(script, targetDurationSec);
      
      // Present data
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
```

#### [NEW] src/interface-adapters/presenters/frame.presenter.ts

**Mục đích:** Format data cho UI, remove sensitive info

```typescript
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
```

#### [NEW] src/interface-adapters/presenters/error.presenter.ts

```typescript
import { ApiKeyMissingError, ApiKeyInvalidError } from '../../entities/errors/api-errors';
import { ScriptParsingError, ImageGenerationError, VideoGenerationError } from '../../entities/errors/generation-errors';

export class ErrorPresenter {
  present(error: unknown): string {
    if (error instanceof ApiKeyMissingError) {
      return 'Vui lòng nhập API key ở thanh trên cùng.';
    }
    
    if (error instanceof ApiKeyInvalidError) {
      return 'API key không hợp lệ hoặc đã hết hạn. Vui lòng nhập lại.';
    }
    
    if (error instanceof ScriptParsingError) {
      return 'Lỗi khi phân tích kịch bản. Vui lòng kiểm tra lại nội dung.';
    }
    
    if (error instanceof ImageGenerationError) {
      return `Lỗi khi tạo hình ảnh cho shot ${(error as any).frameNumber}.`;
    }
    
    if (error instanceof VideoGenerationError) {
      return `Lỗi khi tạo video cho shot ${(error as any).frameNumber}.`;
    }
    
    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  }
}
```

---

### 🔌 Phase 6: Dependency Injection

#### [NEW] src/di/types.ts

```typescript
export const TYPES = {
  // AI Service
  AIService: Symbol.for('AIService'),
  
  // Use Cases
  ParseScriptUseCase: Symbol.for('ParseScriptUseCase'),
  GenerateFrameImageUseCase: Symbol.for('GenerateFrameImageUseCase'),
  GenerateVideoUseCase: Symbol.for('GenerateVideoUseCase'),
  
  // Controllers
  CampaignController: Symbol.for('CampaignController'),
  FrameController: Symbol.for('FrameController'),
  
  // Presenters
  FramePresenter: Symbol.for('FramePresenter'),
  ErrorPresenter: Symbol.for('ErrorPresenter'),
  
  // Config
  ApiKey: Symbol.for('ApiKey'),
};
```

#### [NEW] src/di/container.ts

```typescript
import { Container } from 'ioctopus';
import { TYPES } from './types';

// Infrastructure
import { GeminiAIService } from '../infrastructure/repositories/gemini-ai.service';

// Use Cases
import { ParseScriptUseCase } from '../application/use-cases/parse-script.use-case';
import { GenerateFrameImageUseCase } from '../application/use-cases/generate-frame-image.use-case';
import { GenerateVideoUseCase } from '../application/use-cases/generate-video.use-case';

// Controllers
import { CampaignController } from '../interface-adapters/controllers/campaign.controller';
import { FrameController } from '../interface-adapters/controllers/frame.controller';

// Presenters
import { FramePresenter } from '../interface-adapters/presenters/frame.presenter';
import { ErrorPresenter } from '../interface-adapters/presenters/error.presenter';

export function createContainer(apiKey: string) {
  const container = new Container();

  // Bind API Key
  container.bind(TYPES.ApiKey).toConstantValue(apiKey);

  // Bind AI Service
  container.bind(TYPES.AIService).toDynamicValue(() => 
    new GeminiAIService(apiKey)
  );

  // Bind Use Cases
  container.bind(TYPES.ParseScriptUseCase).toDynamicValue((ctx) =>
    new ParseScriptUseCase(ctx.container.get(TYPES.AIService))
  );

  container.bind(TYPES.GenerateFrameImageUseCase).toDynamicValue((ctx) =>
    new GenerateFrameImageUseCase(ctx.container.get(TYPES.AIService))
  );

  container.bind(TYPES.GenerateVideoUseCase).toDynamicValue((ctx) =>
    new GenerateVideoUseCase(ctx.container.get(TYPES.AIService))
  );

  // Bind Presenters
  container.bind(TYPES.FramePresenter).toClass(FramePresenter);
  container.bind(TYPES.ErrorPresenter).toClass(ErrorPresenter);

  // Bind Controllers
  container.bind(TYPES.CampaignController).toDynamicValue((ctx) =>
    new CampaignController(
      ctx.container.get(TYPES.ParseScriptUseCase),
      ctx.container.get(TYPES.FramePresenter),
      ctx.container.get(TYPES.ErrorPresenter)
    )
  );

  container.bind(TYPES.FrameController).toDynamicValue((ctx) =>
    new FrameController(
      ctx.container.get(TYPES.GenerateFrameImageUseCase),
      ctx.container.get(TYPES.GenerateVideoUseCase),
      ctx.container.get(TYPES.FramePresenter),
      ctx.container.get(TYPES.ErrorPresenter)
    )
  );

  return container;
}
```

---

### 🎨 Phase 7: Refactor Frameworks Layer

#### [MODIFY] App.tsx

**Mục đích:** Chuyển từ God Component thành thin orchestrator

**Trước:** 338 dòng, chứa tất cả logic

**Sau:** ~150 dòng, chỉ orchestrate controllers

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import CharacterPanel from './components/CharacterPanel';
import ScriptPanel from './components/ScriptPanel';
import FrameCard from './components/FrameCard';
import ReferenceAssetsPanel from './components/ReferenceAssetsPanel';

import { createContainer } from './src/di/container';
import { TYPES } from './src/di/types';
import type { CampaignController } from './src/interface-adapters/controllers/campaign.controller';
import type { FrameController } from './src/interface-adapters/controllers/frame.controller';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return (sessionStorage.getItem('duong-ai-video.apiKey') || '').trim();
    } catch {
      return '';
    }
  });

  const handleApiKeyChange = useCallback((next: string) => {
    const trimmed = (next || '').trim();
    setApiKey(trimmed);
    try {
      if (!trimmed) sessionStorage.removeItem('duong-ai-video.apiKey');
      else sessionStorage.setItem('duong-ai-video.apiKey', trimmed);
    } catch {}
  }, []);

  // ✅ Create DI container
  const container = useMemo(() => createContainer(apiKey), [apiKey]);

  const [state, setState] = useState({
    characterImage: null,
    referenceAssets: [],
    targetDurationSec: 30,
    script: '',
    frames: [],
    isProcessingScript: false,
  });

  // ✅ Get controllers from DI container
  const campaignController = container.get<CampaignController>(TYPES.CampaignController);
  const frameController = container.get<FrameController>(TYPES.FrameController);

  const handleProcessScript = async () => {
    if (!state.script || state.isProcessingScript) return;
    if (!apiKey) {
      alert('Vui lòng nhập API key ở thanh trên cùng.');
      return;
    }

    setState(prev => ({ ...prev, isProcessingScript: true, frames: [] }));

    // ✅ Use controller instead of direct logic
    const result = await campaignController.parseScript(state.script, state.targetDurationSec);

    if (result.success) {
      setState(prev => ({ ...prev, frames: result.data!, isProcessingScript: false }));
    } else {
      alert(result.error);
      setState(prev => ({ ...prev, isProcessingScript: false }));
    }
  };

  const handleGenerateFrameImage = async (frameNumber: number) => {
    const frameIndex = state.frames.findIndex(f => f.frameNumber === frameNumber);
    if (frameIndex === -1 || !state.characterImage) return;
    if (!apiKey) {
      alert('Vui lòng nhập API key ở thanh trên cùng.');
      return;
    }

    // Start progress simulation
    let progress = 0;
    const progressInterval = setInterval(() => {
      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1 && nextFrames[idx].isGenerating) {
          const increment = progress < 70 ? 5 : progress < 90 ? 2 : 0.5;
          progress = Math.min(progress + increment, 95);
          nextFrames[idx] = { ...nextFrames[idx], imageProgress: Math.floor(progress) };
        }
        return { ...prev, frames: nextFrames };
      });
    }, 400);

    setState(prev => {
      const nextFrames = [...prev.frames];
      nextFrames[frameIndex] = { ...nextFrames[frameIndex], isGenerating: true, imageProgress: 0 };
      return { ...prev, frames: nextFrames };
    });

    // ✅ Use controller
    const result = await frameController.generateImage(
      state.frames[frameIndex],
      { imageBase64: state.characterImage },
      state.referenceAssets
    );

    clearInterval(progressInterval);

    if (result.success) {
      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1) {
          nextFrames[idx] = { ...nextFrames[idx], imageUrl: result.data, isGenerating: false, imageProgress: 100 };
        }
        return { ...prev, frames: nextFrames };
      });
    } else {
      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1) {
          nextFrames[idx] = { ...nextFrames[idx], isGenerating: false, imageProgress: undefined };
        }
        return { ...prev, frames: nextFrames };
      });
      alert(result.error);
    }
  };

  // ... similar refactoring for handleGenerateVideo

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* ... existing JSX */}
    </div>
  );
};

export default App;
```

---

## Verification Plan

### Automated Tests

#### Unit Tests

**Vị trí:** `tests/unit/`

**Các tests cần viết:**

1. **Entities Tests**
   ```bash
   # Command
   npm run test tests/unit/entities
   ```
   - `frame.model.test.ts`: Test Zod validation
   - `api-errors.test.ts`: Test custom error classes

2. **Use Cases Tests**
   ```bash
   # Command
   npm run test tests/unit/application/use-cases
   ```
   - `parse-script.use-case.test.ts`: Mock AIService, test business logic
   - `generate-frame-image.use-case.test.ts`: Test with mocked dependencies
   - `generate-video.use-case.test.ts`: Test video generation flow

3. **Controllers Tests**
   ```bash
   # Command
   npm run test tests/unit/interface-adapters/controllers
   ```
   - `campaign.controller.test.ts`: Test error handling, presenter usage
   - `frame.controller.test.ts`: Test orchestration logic

**Setup test:**
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

**Chạy tests:**
```bash
npm run test          # Chạy tất cả tests
npm run test:ui       # Mở UI để xem results
npm run test:coverage # Check coverage
```

---

### Manual Verification

> [!NOTE]
> **Test Scenarios**
> 
> Sau khi hoàn thành refactoring, cần test thủ công các chức năng chính:

#### Scenario 1: Parse Script
1. Mở ứng dụng: `npm run dev`
2. Nhập API key vào header
3. Tải lên ảnh nhân vật
4. Paste kịch bản vào ScriptPanel
5. Chọn thời lượng (ví dụ: 30s)
6. Click "Tạo Shot List"
7. **Expected:** Shot list xuất hiện, có đúng số shots dựa trên duration

#### Scenario 2: Generate Frame Image
1. Sau khi có shot list từ Scenario 1
2. Click "Tạo Hình Ảnh" trên bất kỳ frame nào
3. **Expected:** 
   - Progress bar hiển thị từ 0% → 100%
   - Hình ảnh xuất hiện sau khi hoàn thành
   - Nhân vật trong ảnh khớp với ảnh tham chiếu

#### Scenario 3: Generate Video
1. Sau khi có frame có hình ảnh từ Scenario 2
2. Click "Tạo Clip (Veo)" trên frame đó
3. **Expected:**
   - Loading spinner hiển thị
   - Progress messages cập nhật
   - Video tự động play sau khi hoàn thành

#### Scenario 4: Error Handling
1. Không nhập API key → Click "Tạo Shot List"
   - **Expected:** Alert "Vui lòng nhập API key"
2. Nhập API key sai → Click "Tạo Shot List"
   - **Expected:** Alert "API key không hợp lệ"
3. Network error simulation (tắt mạng) → Click generate image
   - **Expected:** Alert lỗi có ý nghĩa

#### Scenario 5: Generate All Visible
1. Có shot list với nhiều frames
2. Click "Tạo Tất Cả Visual"
3. **Expected:** Tất cả frames được generate tuần tự

---

### Integration Tests

**Không bắt buộc ngay lúc này**, nhưng nên có trong tương lai:

```bash
# Command (khi implement)
npm run test:integration
```

**Nội dung:**
- Test end-to-end flow: Parse script → Generate images → Generate videos
- Test với real Gemini API (sử dụng test API key)

---

## Migration Strategy

### Cách Tiếp Cận: Feature-by-Feature

**Week 1: Foundation + Entities**
- [ ] Day 1-2: Setup folders, install deps, configure ESLint
- [ ] Day 3-4: Create entities (models, errors, constants)
- [ ] Day 5: Write entity tests

**Week 2: Application + Infrastructure**
- [ ] Day 1-2: Create use cases
- [ ] Day 3-4: Refactor geminiService → GeminiAIService
- [ ] Day 5: Write use case tests

**Week 3: Adapters + UI**
- [ ] Day 1-2: Create controllers and presenters
- [ ] Day 3-4: Refactor App.tsx
- [ ] Day 5: Manual testing, bug fixes

**Week 4: Testing + Documentation**
- [ ] Day 1-2: Complete test coverage
- [ ] Day 3-4: Code review, refactoring
- [ ] Day 5: Documentation, deployment

---

## Deployment Plan

### Incremental Deployment

**Không deploy "big bang"**, thay vào đó:

1. **Phase 1-2:** Local development only (không deploy)
2. **Phase 3:** Deploy sau khi có use cases + tests pass
3. **Phase 4-5:** Deploy sau khi refactor services + controllers
4. **Phase 6-7:** Final deployment sau khi App.tsx hoàn chỉnh

**Rollback Plan:**
- Keep `App.tsx.backup` trước khi refactor
- Git branches cho từng phase
- Có thể rollback về old code nếu cần

---

## Metrics & Success Criteria

### Before vs After

| Metric | Before | After (Goal) |
|--------|--------|--------------|
| Largest file size | 338 lines | < 200 lines |
| Test coverage | 0% | 80%+ |
| Number of files | 10 | ~40 |
| Cyclomatic complexity | High | Low |
| Coupling | Tight | Loose |
| Time to add feature | 1-2 days | 2-4 hours |
| Onboarding time | 2 days | 2 hours |

### Success Criteria

- ✅ All existing features work exactly as before
- ✅ 80%+ test coverage (use cases, controllers)
- ✅ ESLint boundaries enforced (no violations)
- ✅ App.tsx < 200 lines
- ✅ Documentation updated
- ✅ Team members understand architecture

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing features | Medium | High | Write tests first, incremental testing |
| Team resistance | Low | Medium | Training sessions, pair programming |
| Time overrun | Medium | Medium | Prioritize critical paths first |
| Learning curve (DI, etc.) | High | Low | Provide examples, documentation |

---

## Next Steps

Sau khi user approve plan này:

1. Create branch `refactor/clean-architecture`
2. Start with Phase 1: Foundation Setup
3. Commit sau mỗi phase hoàn thành
4. Request code review từ team
5. Merge vào main sau khi all tests pass
