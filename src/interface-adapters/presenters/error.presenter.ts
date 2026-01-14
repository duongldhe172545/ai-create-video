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

        if (error instanceof Error) {
            return error.message;
        }

        return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
    }
}
