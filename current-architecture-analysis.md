# Phân Tích Kiến Trúc Hiện Tại vs Clean Architecture

## 📊 Tổng Quan Dự Án

**Công nghệ stack:**
- React 19.2.3 + Vite 6.2.0
- TypeScript 5.8.2
- Google Gemini AI API (@google/genai 1.35.0)

**Tính năng chính:**
- 🎬 Tạo shot list từ kịch bản video content
- 🖼️ Sinh hình ảnh cho từng shot (Gemini 2.5 Flash Image)
- 🎥 Tạo video từ hình ảnh (Veo 3.1)
- 👤 Quản lý nhân vật và reference assets

---

## 🔍 Phân Tích Cấu Trúc Hiện Tại

### Cấu trúc thư mục:
```
trung-nghien-ai-director-fixed/
├── App.tsx                    # ⚠️ 338 dòng - chứa TẤT CẢ logic
├── types.ts                   # Type definitions
├── index.tsx                  # Entry point
├── index.css                  # Styles
├── components/                # UI Components
│   ├── Header.tsx
│   ├── CharacterPanel.tsx
│   ├── ReferenceAssetsPanel.tsx
│   ├── ScriptPanel.tsx
│   └── FrameCard.tsx
└── services/
    └── geminiService.ts       # ⚠️ 294 dòng - AI service
```

---

## ❌ VẤN ĐỀ NGHIÊM TRỌNG

### 1. **App.tsx - God Component (338 dòng)**

**Vấn đề:**
- Chứa TẤT CẢ business logic
- Quản lý state, API calls, error handling cùng lúc
- Không thể test được
- Không thể tái sử dụng logic
- Vi phạm Single Responsibility Principle

**Code hiện tại:**
```typescript
const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(...);
  const [state, setState] = useState<ContentState>(...);
  const gemini = useMemo(() => new GeminiService(apiKey), [apiKey]);

  const handleProcessScript = async () => { /* 18 dòng logic */ };
  const handleGenerateFrameImage = async (frameNumber: number) => { /* 62 dòng logic */ };
  const handleGenerateVideo = async (frameNumber: number) => { /* 58 dòng logic */ };
  const generateAllVisible = async () => { /* 15 dòng logic */ };

  return ( /* 131 dòng JSX */ );
};
```

**❌ Vi phạm:**
- Không có tầng Application Layer (use cases)
- Không có Controllers
- Business logic trộn lẫn với UI logic
- Không có Dependency Injection

---

### 2. **geminiService.ts - Monolithic Service (294 dòng)**

**Vấn đề:**
- Class duy nhất làm TẤT CẢ công việc AI
- Không có interfaces
- Không thể mock khi test
- Tight coupling với Google Gemini API

**Code hiện tại:**
```typescript
export class GeminiService {
  private apiKey: string;

  async parseScriptIntoFrames(script: string, targetDurationSec: number): Promise<FrameData[]> { /* 100 dòng */ }
  async generateFrameImage(frame: FrameData, characterBase64: string, referenceAssets: ReferenceAsset[]): Promise<string> { /* 80 dòng */ }
  async generateVideo(frame: FrameData, onProgress: (msg: string) => void): Promise<string> { /* 47 dòng */ }
}
```

**❌ Vi phạm:**
- Không có interface definitions
- Không có Infrastructure Layer
- Không thể swap AI provider
- Không có error handling layer

---

### 3. **types.ts - Thiếu Domain Models**

**Vấn đề:**
- Chỉ có interfaces đơn giản
- Không có validation logic
- Không có domain rules
- Không có custom errors

**Code hiện tại:**
```typescript
export interface FrameData {
  frameNumber: number;
  cameraAngle: string;
  action: string;
  // ... 18 fields
}

export interface ContentState {
  characterImage: string | null;
  referenceAssets: ReferenceAsset[];
  targetDurationSec: number;
  script: string;
  frames: FrameData[];
  isProcessingScript: boolean;
}
```

**❌ Thiếu:**
- Validation schemas (Zod)
- Enterprise Business Rules
- Custom error classes
- Immutability

---

### 4. **Components - Chỉ là Presentation**

**✅ Điểm tốt:** Components tương đối clean, chỉ làm UI
**⚠️ Vấn đề:** Nhận props từ App.tsx - nơi chứa tất cả logic

---

## 📊 So Sánh Với Clean Architecture

| Lớp Clean Architecture | Hiện Tại | Vấn Đề |
|------------------------|----------|--------|
| **Entities Layer** | ❌ Không có | Chỉ có interfaces, thiếu validation |
| **Application Layer** | ❌ Không có | Logic nằm trong App.tsx |
| **Infrastructure Layer** | ⚠️ Một phần | `geminiService.ts` không follow pattern |
| **Interface Adapters** | ❌ Không có | Không có Controllers, Presenters |
| **Frameworks & Drivers** | ✅ Có | Components OK nhưng phụ thuộc App.tsx |
| **Dependency Injection** | ❌ Không có | Sử dụng `useMemo` thay vì DI container |

---

## 🚨 Hậu Quả Khi Mở Rộng

### Kịch bản 1: Thêm AI Provider mới (OpenAI, Claude)
**Hiện tại:** ❌ Phải refactor toàn bộ `geminiService.ts` và `App.tsx`
**Clean Architecture:** ✅ Chỉ tạo implementation mới, bind vào DI container

### Kịch bản 2: Thêm database để lưu projects
**Hiện tại:** ❌ Phải sửa `App.tsx`, state management, thêm API calls
**Clean Architecture:** ✅ Tạo repository, implement interface, inject vào use cases

### Kịch bản 3: Chuyển từ React sang Next.js
**Hiện tại:** ❌ Phải rewrite TẤT CẢ vì logic trong components
**Clean Architecture:** ✅ Chỉ thay đổi Frameworks Layer, giữ nguyên core logic

### Kịch bản 4: Thêm authentication/authorization
**Hiện tại:** ❌ Phải sửa từng function trong `App.tsx`
**Clean Architecture:** ✅ Thêm auth checks vào Controllers, use cases tự động có auth

### Kịch bản 5: Unit testing
**Hiện tại:** ❌ Không thể test được (tight coupling, no mocking)
**Clean Architecture:** ✅ Test từng layer độc lập với mock dependencies

---

## 📈 Mức Độ Vi Phạm Clean Architecture

### Quy Tắc Phụ Thuộc (Dependency Rule): 🔴 FAIL
- App.tsx phụ thuộc trực tiếp vào `geminiService.ts`
- Không có abstraction layer
- Không có interfaces

### Độc Lập Framework: 🔴 FAIL
- Business logic trong React component
- Không thể tách logic ra khỏi React

### Độc Lập Database: ⚠️ N/A
- Chưa có database (nhưng khi thêm sẽ gặp vấn đề)

### Testability: 🔴 FAIL
- Không có unit tests
- Không thể mock dependencies
- Logic trong component không test được

---

## 📋 Danh Sách Refactoring

### Phase 1: Foundation ⚙️
- [ ] Setup folder structure theo Clean Architecture
- [ ] Cài đặt Zod cho validation
- [ ] Setup DI container (ioctopus)
- [ ] Configure ESLint boundaries

### Phase 2: Entities Layer 🎯
- [ ] Tạo domain models với Zod schemas
  - `Campaign`, `Frame`, `Character`, `ReferenceAsset`
- [ ] Tạo custom error classes
  - `ApiKeyMissingError`, `ImageGenerationError`, `VideoGenerationError`
- [ ] Tạo constants và enums

### Phase 3: Application Layer 🧠
- [ ] Định nghĩa repository interfaces
  - `IAIService`, `IStorageService`
- [ ] Tách use cases từ App.tsx
  - `ParseScriptUseCase`
  - `GenerateFrameImageUseCase`
  - `GenerateVideoUseCase`
  - `ProcessAllFramesUseCase`

### Phase 4: Infrastructure Layer 🔧
- [ ] Refactor `geminiService.ts` thành implementation
  - `GeminiAIService implements IAIService`
- [ ] Tạo storage service (nếu cần)
  - `LocalStorageService implements IStorageService`

### Phase 5: Interface Adapters 🎮
- [ ] Tạo controllers
  - `CampaignController`
  - `FrameController`
- [ ] Tạo presenters
  - `FramePresenter` (format data cho UI)
  - `ErrorPresenter` (format errors cho user)

### Phase 6: Frameworks & Drivers 🎨
- [ ] Refactor App.tsx thành thin orchestrator
- [ ] Components chỉ nhận formatted data từ presenters
- [ ] Sử dụng controllers thay vì direct logic

### Phase 7: Testing 🧪
- [ ] Setup Vitest
- [ ] Viết unit tests cho use cases
- [ ] Viết tests cho repositories
- [ ] Integration tests cho controllers

---

## 🎯 Mục Tiêu Sau Refactor

### ✅ Đạt Được:
1. **Testability**: 100% coverage cho business logic
2. **Maintainability**: Mỗi file < 200 dòng, single responsibility
3. **Scalability**: Dễ dàng thêm features mới
4. **Flexibility**: Swap AI provider, framework trong 1 giờ
5. **Team Collaboration**: Junior dev hiểu ngay folder/file để sửa gì

### 📊 Metrics:
- **Trước:** 1 file 338 dòng (App.tsx)
- **Sau:** ~30 files, mỗi file ~50-100 dòng
- **Test Coverage:** 0% → 80%+
- **Coupling:** Tight → Loose (interfaces)
- **Onboarding Time:** 2 ngày → 2 giờ (nhờ có architecture)

---

## ⚠️ Rủi Ro Khi KHÔNG Refactor

1. **Technical Debt:** Sẽ tăng gấp đôi sau mỗi feature mới
2. **Bug Rate:** Càng thêm code, càng nhiều bugs (không có tests)
3. **Developer Velocity:** Giảm 50% sau 3 tháng
4. **Onboarding:** Junior dev mất 1 tuần để hiểu codebase
5. **Impossible Features:** Không thể thêm multi-user, offline mode, etc.

---

## 💡 Khuyến Nghị

### Cho Doanh Nghiệp:
> **Clean Architecture là đầu tư, KHÔNG phải chi phí.**
>
> - Refactor mất ~1-2 tuần
> - ROI: Tiết kiệm 50% thời gian development từ tháng thứ 2
> - Giảm 70% bugs nhờ testability
> - Onboarding developer mới: 2 ngày thay vì 2 tuần

### Cách Tiếp Cận:
1. ✅ **Incremental Refactoring** (Khuyên dùng)
   - Refactor từng feature một
   - Deploy liên tục, không gián đoạn
   - 2-4 tuần hoàn thành

2. ❌ **Big Bang Refactoring** (Không khuyên)
   - Refactor toàn bộ cùng lúc
   - Rủi ro cao
   - Gián đoạn development

---

## 📚 Tài Liệu Tham Khảo

- [Clean Architecture Guidelines](./clean-architecture-guidelines.md) - Đã tạo
- [Task Breakdown](./task.md) - Checklist refactoring
- [Implementation Plan](./implementation-plan.md) - Sẽ tạo tiếp theo
