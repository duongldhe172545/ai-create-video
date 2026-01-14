<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Dương-ai-video - Đạo diễn hình ảnh AI

Ứng dụng Dương-ai-video giúp tạo **shot list video content** từ kịch bản, sử dụng:
- **Gemini** để phân tích kịch bản thành các shot (hook / on-screen text / voiceover / CTA)
- **Gemini 2.5 Flash Image (Nano Banana)** để tạo visual từ ảnh nhân vật tham chiếu
- **Veo 3.1** để tạo clip video từ visual

## 🚀 Chạy Locally

**Yêu cầu:** Node.js 18+

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình API Key

Ứng dụng sử dụng mô hình **BYOK (Bring Your Own Key)**: bạn nhập API key trực tiếp trong giao diện (ô ở thanh trên cùng).

- Lấy API key tại: https://aistudio.google.com/apikey
- Lưu ý: API key được dùng từ trình duyệt của bạn. Không commit key lên GitHub.

### 3. Chạy ứng dụng
```bash
npm run dev
```

Truy cập: http://localhost:3000

## ⚠️ Lưu ý quan trọng

### API Key & Billing
- **Gemini** (phân tích kịch bản, tạo ảnh): Free tier có rate limit
- **Veo 3.1** (tạo video): **Yêu cầu Paid plan** - Bạn cần enable billing cho Google Cloud project

Xem [tài liệu billing](https://ai.google.dev/gemini-api/docs/billing) để biết thêm chi tiết.

### Models sử dụng
| Tính năng | Model |
|-----------|-------|
| Phân tích kịch bản | `gemini-3-flash-preview` |
| Tạo hình ảnh | `gemini-2.5-flash-image` |
| Tạo video | `veo-3.1-fast-generate-preview` |

## 📖 Hướng dẫn sử dụng

1. **Tải ảnh nhân vật**: Upload ảnh chân dung/toàn thân rõ ràng
2. **Nhập kịch bản/nội dung**: Paste nội dung bạn muốn làm thành video
3. **Tạo shot list**: Nhấn nút để AI tạo shot list video content
4. **Tạo visual**: Click từng shot hoặc "Tạo Tất Cả"
5. **Tạo clip**: Click "Tạo Clip (Veo)" trên mỗi shot có visual

## 🔗 Links
- [View in AI Studio](https://ai.studio/apps/drive/1KvmOZNMnwfgr_tUUlzXtr7u04M5dRD62)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Veo 3.1 Docs](https://ai.google.dev/gemini-api/docs/video)
