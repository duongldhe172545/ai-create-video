import { IConsultantService } from '../repositories/consultant-service.interface';
import { ConsultantMessage } from '../../entities/models/consultant-message.model';

export class ConsultIdeaUseCase {
    constructor(private consultantService: IConsultantService) { }

    async execute(messages: ConsultantMessage[], apiKey: string): Promise<string> {
        // Add system prompt context if not present (optional, but good for "Consultant" persona)
        const contextMessages: ConsultantMessage[] = [
            {
                role: 'system',
                content: 'Bạn là chuyên gia tư vấn sáng tạo nội dung video ngắn (TikTok/Reels). Nhiệm vụ của bạn là đặt câu hỏi gợi mở để giúp người dùng tìm ra ý tưởng video hay, phân tích đối thủ, hoặc đề xuất các góc nhìn marketing độc đáo. Hãy trả lời ngắn gọn, súc tích và mang tính hành động.'
            },
            ...messages
        ];

        return await this.consultantService.chat(contextMessages, apiKey);
    }
}
