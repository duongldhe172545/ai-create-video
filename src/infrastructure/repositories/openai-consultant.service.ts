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
      Nhiệm vụ: Viết kịch bản video dạng văn xuôi tự nhiên, cuốn hút dựa trên yêu cầu sau:
      - Chủ đề: ${request.topic}
      - Tone: ${request.tone}
      - Thị trường: ${request.market}
      - Ngôn ngữ: ${request.language}
      - Khách hàng mục tiêu: ${request.targetAudience ?? 'Đại chúng'}

      YÊU CẦU ĐỊNH DẠNG:
      - KHÔNG viết dưới dạng "Shot 1", "Shot 2"
      - Viết dưới dạng văn xuôi liền mạch, tự nhiên như đang kể chuyện
      - Mỗi câu nên mô tả một hành động, cảm xúc, hoặc hình ảnh cụ thể
      - Sử dụng ngôn ngữ sinh động, dễ hình dung
      - Độ dài: Tương đương 30-60 giây nội dung khi đọc (~100-200 từ)

      Ví dụ format mong muốn:
      "Một nữ sinh lớp 12 luôn đứng đầu trường bước vào ngày kiểm tra thử quan trọng với nụ cười "ổn" quen thuộc, nhưng khi tờ đề chạm tay, mọi âm thanh như bị bóp nghẹt và cô bỗng đặt bút xuống, để trang giấy trắng trở thành lời thú nhận không nói ra. Trước ánh nhìn của cả lớp, cô xin phép "không nộp bài" rồi lặng lẽ ra hành lang, nơi cô giáo không trách mắng mà chỉ hỏi một câu đơn giản: "Em có đang kiệt sức không?". Trưa hôm đó, cô bạn thân tìm thấy cô ngoài sân trường, không ép giải thích, chỉ ngồi cạnh và đưa chai nước như một cách kéo cô về lại nhịp thở..."

      Lưu ý:
      - Hãy viết kịch bản sáng tạo, bắt trend, phù hợp với thị trường ${request.market}
      - Nếu là thị trường Vietnam, hãy dùng văn phong tự nhiên, đời thường, có cảm xúc
      - Tập trung vào câu chuyện và cảm xúc, KHÔNG liệt kê từng shot
      - Kịch bản phải dễ hình dung thành video ngắn
      `;

        const messages: ConsultantMessage[] = [
            { role: 'system', content: 'Bạn là chuyên gia biên kịch video ngắn đa năng.' },
            { role: 'user', content: prompt }
        ];

        return this.chat(messages, apiKey);
    }
}

