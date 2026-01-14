import { IConsultantService } from '../../application/repositories/consultant-service.interface';
import { ConsultantMessage } from '../../entities/models/consultant-message.model';
import { ScriptRequest } from '../../entities/models/script-request.model';

export class OpenAIConsultantService implements IConsultantService {
    async chat(messages: ConsultantMessage[], apiKey: string): Promise<string> {
        if (!apiKey) throw new Error("API Key is missing");

        // Use local proxy if running in dev/preview to avoid CORS
        // In production, this would need a real backend or a proxy.
        const baseUrl = import.meta.env.DEV ? '/api/openai' : 'https://api.openai.com/v1';

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-5.2', // Requesting user's specific model
                    messages: messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || response.statusText;

                // Helpful alert for common errors
                if (response.status === 404) {
                    throw new Error(`Model 'gpt-5.2' không tồn tại (404). Hãy kiểm tra lại tên model.`);
                }
                if (response.status === 401) {
                    throw new Error(`API Key không hợp lệ (401). Hãy kiểm tra lại key.`);
                }
                if (response.status === 429) {
                    throw new Error(`Hết quota hoặc bị giới hạn rate limit (429).`);
                }

                throw new Error(`OpenAI API Error: ${response.status} - ${errorMessage}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "No response content";

        } catch (error: any) {
            // Catch network errors (like CORS if proxy fails or direct call blocked)
            console.error("OpenAI Call Failed:", error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error("Lỗi kết nối (Network Error). Có thể do CORS chặn. Hãy đảm bảo bạn đang chạy qua Proxy hoặc Server Backend.");
            }
            throw error;
        }

    }

    async generateScript(request: ScriptRequest, apiKey: string): Promise<string> {
        if (!apiKey) throw new Error("OpenAI API Key is required for script generation");

        const prompt = `
      Hãy đóng vai một Đạo diễn & Biên kịch video ngắn chuyên nghiệp (TikTok/Reels/Shorts).
      Nhiệm vụ: Viết kịch bản video dựa trên yêu cầu sau:
      - Chủ đề: ${request.topic}
      - Tone: ${request.tone}
      - Thị trường: ${request.market}
      - Ngôn ngữ: ${request.language}
      - Khách hàng mục tiêu: ${request.targetAudience ?? 'Đại chúng'}

      YÊU CẦU ĐỊNH DẠNG (Bắt buộc tuân thủ):
      Kịch bản phải trả về dưới dạng văn bản thuần (plain text), phân chia rõ ràng từng phân cảnh (Shot).
      Mỗi Shot bắt buộc phải có cấu trúc sau:
      "Shot [Số]: [Mô tả hình ảnh/hành động] (Thời lượng nếu cần, ví dụ (5s))
      Audio: [Lời thoại hoặc âm thanh]"

      Ví dụ:
      Shot 1: Cận cảnh một tách cà phê bốc khói nghi ngút bên cửa sổ trời mưa. (3s)
      Audio: Tiếng mưa rơi rả rích, nhạc lo-fi nhẹ nhàng nổi lên.
      
      Shot 2: Nhân vật chính (nữ, 25 tuổi) bước vào khung hình, tay cầm quyển sách cũ. (4s)
      Audio: (Giọng MC trầm ấm) "Có những ngày bình yên đến lạ..."

      Lưu ý:
      - Hãy viết kịch bản sáng tạo, bắt trend, phù hợp với thị trường ${request.market}.
      - Nếu là thị trường Vietnam, hãy dùng văn phong tự nhiên, đời thường.
      - Đảm bảo độ dài khoảng 30-60 giây (khoảng 6-10 shots).
      `;

        const messages: ConsultantMessage[] = [
            { role: 'system', content: 'Bạn là chuyên gia biên kịch video ngắn đa năng.' },
            { role: 'user', content: prompt }
        ];

        return this.chat(messages, apiKey);
    }
}

