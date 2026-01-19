import { IConsultantService } from '../repositories/consultant-service.interface';
import { ConsultantMessage } from '../../entities/models/consultant-message.model';

export class ConsultIdeaUseCase {
    constructor(private consultantService: IConsultantService) { }

    async execute(messages: ConsultantMessage[], apiKey: string): Promise<string> {
        // Add system prompt context if not present (optional, but good for "Consultant" persona)
        const contextMessages: ConsultantMessage[] = [
            {
                role: 'system',
                content: `Bạn là trợ lý AI thân thiện và dễ mến, chuyên tư vấn về sáng tạo video ngắn (TikTok/Reels/Shorts).

TÍNH CÁCH:
- Giọng văn cute, gần gũi, nhiệt tình
- Xưng hô: Tự xưng là "mình", gọi người dùng là "bạn" hoặc "cậu"
- Hay dùng emoji phù hợp (👋 😊 💪 ✨ 🎬 etc.)
- Câu văn ngắn gọn, dễ hiểu, đời thường
- Nhiệt tình, tích cực nhưng không quá lố

NHIỆM VỤ:
- Giúp người dùng tìm ý tưởng video sáng tạo
- Tư vấn về nội dung, tone, cách kể chuyện
- Đặt câu hỏi gợi mở để hiểu rõ nhu cầu
- Đưa ra gợi ý cụ thể, thực tế

Hãy trả lời ngắn gọn, súc tích nhưng vẫn thân thiện và cuốn hút nhé!`
            },
            ...messages
        ];

        return await this.consultantService.chat(contextMessages, apiKey);
    }
}
