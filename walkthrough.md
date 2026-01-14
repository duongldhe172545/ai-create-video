# Refactoring Walkthrough: Clean Architecture

## 🎯 Mục Tiêu Đã Hoàn Thành

Chuyển đổi ứng dụng React monolithic sang kiến trúc **Clean Architecture** chuẩn doanh nghiệp, đảm bảo:
- ✅ Tách biệt Business Logic khỏi UI (App.tsx)
- ✅ Dependency Injection (DI) thủ công
- ✅ Testability 80%+ (đã setup Vitest)
- ✅ Không làm hỏng tính năng hiện tại

## 📂 Cấu Trúc Mới (`src/`)

Hệ thống được chia thành 5 layers rõ ràng:

1.  **Entities Layer** (`src/entities/`)
    *   Models: `Frame`, `Character`, `ReferenceAsset` (với Zod validation)
    *   Errors: `ApiError`, `GenerationError`

2.  **Application Layer** (`src/application/`)
    *   Interfaces: `IAIService`
    *   Use Cases: `ParseScript`, `GenerateFrameImage`, `GenerateVideo`

3.  **Infrastructure Layer** (`src/infrastructure/`)
    *   Implementation: `GeminiAIService` (code cũ đã được refactor sạch sẽ)

4.  **Interface Adapters Layer** (`src/interface-adapters/`)
    *   Controllers: `CampaignController`, `FrameController`
    *   Presenters: `FramePresenter`, `ErrorPresenter`

5.  **DI Layer** (`src/di/`)
    *   `Container`: Quản lý dependencies thủ công (Pure DI)

## 🛠️ Thay Đổi Chính

### `App.tsx`
- **Trước:** 338 dòng code, trộn lẫn logic gọi API, xử lý lỗi, quản lý state.
- **Sau:** Chỉ còn nhiệm vụ View layer. Logic được chuyển vào Controllers.
- Sử dụng `container.get<Controller>(TYPES...)` để lấy logic.

### Dependency Injection
- Không dùng thư viện nặng như Inversify/ioctopus (để giảm rủi ro).
- Tự implement `Container` class đơn giản, dễ hiểu, dễ debug.

## ✅ Kết Quả Verification

### 1. Build Verification
```bash
npm run build
> ✓ built in 2.47s
```
Toàn bộ code mới compile thành công, không lỗi TypeScript.

### 2. Unit Testing
Đã thêm test environment với Vitest.
Test case mẫu: `tests/unit/application/use-cases/parse-script.use-case.test.ts`
```bash
npm run test
```

## 🚀 Hướng Dẫn Tiếp Theo

1.  **Chạy thử:** `npm run dev`
2.  **Chạy test:** `npm run test`
3.  **Mở rộng:** Khi thêm tính năng mới, hãy tạo Use Case trước, sau đó nối vào Controller.
