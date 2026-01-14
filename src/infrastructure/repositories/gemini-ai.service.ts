import { GoogleGenAI, Type } from '@google/genai';
import { IAIService } from '../../application/repositories/ai-service.interface';
import { Frame, FrameModel } from '../../entities/models/frame.model';
import { ReferenceAsset } from '../../entities/models/reference-asset.model';
import { ApiKeyMissingError, ApiKeyInvalidError } from '../../entities/errors/api-errors';
import { ScriptParsingError, ImageGenerationError, VideoGenerationError } from '../../entities/errors/generation-errors';

export class GeminiAIService implements IAIService {
    constructor(private apiKey: string) { }

    private getClient(): GoogleGenAI {
        if (!this.apiKey || this.apiKey.trim().length === 0) {
            throw new ApiKeyMissingError();
        }
        return new GoogleGenAI({ apiKey: this.apiKey });
    }

    private parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
            return { mimeType: 'image/png', data: dataUrl };
        }
        return { mimeType: match[1], data: match[2] };
    }

    private buildShotDurations(targetDurationSec: number): number[] {
        const total = Math.max(8, Math.min(120, Math.round(targetDurationSec || 30)));
        const maxShot = 8;
        const minShot = 5;

        const shotCount = Math.max(1, Math.ceil(total / maxShot));
        const durations = new Array(shotCount).fill(maxShot);
        durations[shotCount - 1] = total - maxShot * (shotCount - 1);

        if (durations[shotCount - 1] < minShot) {
            let last = durations[shotCount - 1];
            let needed = minShot - last;
            for (let i = 0; i < shotCount - 1 && needed > 0; i++) {
                const canGive = durations[i] - minShot;
                if (canGive <= 0) continue;
                const give = Math.min(canGive, needed);
                durations[i] -= give;
                last += give;
                needed -= give;
            }
            durations[shotCount - 1] = last;
        }

        return durations.map(d => Math.max(minShot, Math.min(maxShot, Math.round(d))));
    }

    async parseScriptIntoFrames(script: string, targetDurationSec: number): Promise<Frame[]> {
        const ai = this.getClient();

        try {
            const clampedTarget = Math.max(8, Math.min(120, Math.round(targetDurationSec || 30)));
            const durations = this.buildShotDurations(clampedTarget);
            const shotCount = durations.length;
            const durationsList = durations.join('-');

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash", // Updated to stable model or flash-preview
                contents: `Bạn là chuyên gia sản xuất VIDEO CONTENT (TikTok/Reels/Shorts). Hãy phân tích nội dung sau thành các SHOT ngắn (shot list) để dựng một video content.

        MỤC TIÊU THỜI LƯỢNG:
        - Video dài khoảng ${clampedTarget} giây (tối đa 120 giây).
        - Tạo ĐÚNG ${shotCount} shot.
        - durationSec ưu tiên 8 giây/shot, KHÔNG tạo shot 2-3 giây.
        - durationSec mỗi shot phải nằm trong khoảng 5-8 giây.
        - Phân bổ durationSec theo mẫu sau (có thể đổi thứ tự, nhưng phải đúng tổng): ${durationsList}

        Yêu cầu:
        - Viết TIẾNG VIỆT, rõ ràng, thiên về marketing/content (không cần thuật ngữ điện ảnh quá nặng).
        - Mỗi shot nên có mục tiêu rõ (hook/giữ chân/giải thích/CTA).
        - Mặc định khung hình dọc 9:16 cho video ngắn.

        Với mỗi shot, hãy cung cấp:
        - frameNumber (số thứ tự)
        - cameraAngle (góc máy đơn giản)
        - action (mô tả hình ảnh/hành động trong shot)
        - environment (bối cảnh)
        - lighting (ánh sáng)
        - sound (âm thanh/nhạc/ambience) (tuỳ chọn)
        - hook (câu mở đầu 1-2 giây, tuỳ chọn)
        - onScreenText (text hiển thị trên màn hình, ngắn gọn)
        - voiceover (lời thoại/voice over, tuỳ chọn)
        - cta (kêu gọi hành động, tuỳ chọn)
        - aspectRatio ("9:16" hoặc "16:9", mặc định "9:16")

        NỘI DUNG:
        ${script}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                frameNumber: { type: Type.INTEGER },
                                cameraAngle: { type: Type.STRING },
                                action: { type: Type.STRING },
                                environment: { type: Type.STRING },
                                lighting: { type: Type.STRING },
                                sound: { type: Type.STRING },
                                hook: { type: Type.STRING },
                                onScreenText: { type: Type.STRING },
                                voiceover: { type: Type.STRING },
                                cta: { type: Type.STRING },
                                durationSec: { type: Type.INTEGER },
                                aspectRatio: { type: Type.STRING },
                            },
                            required: ["frameNumber", "cameraAngle", "action", "environment", "lighting", "onScreenText", "durationSec"],
                        },
                    },
                },
            });

            const parsed = JSON.parse(response.text || '[]') as Frame[];
            if (!Array.isArray(parsed) || parsed.length === 0) return [];

            // Logic xử lý shot count
            let frames: Frame[] = parsed.slice(0, shotCount);
            if (frames.length < shotCount) {
                const last = frames[frames.length - 1];
                while (frames.length < shotCount) {
                    frames.push({
                        frameNumber: frames.length + 1,
                        cameraAngle: last?.cameraAngle || 'Trung cảnh',
                        action: last?.action ? `Tiếp tục/nhấn mạnh ý chính: ${last.action}` : 'Tiếp tục nội dung theo mạch kịch bản.',
                        environment: last?.environment || 'Bối cảnh phù hợp nội dung',
                        lighting: last?.lighting || 'Ánh sáng tự nhiên, rõ nét',
                        onScreenText: '',
                        durationSec: 8,
                        aspectRatio: (last?.aspectRatio as any) || '9:16',
                    } as Frame);
                }
            }

            frames = frames.map((f, idx) => {
                // Check for inline duration override in action or other fields
                // Regex to find (5s), [5s], (5 giây), etc. allow spaces e.g. ( 5s )
                const durationMatch = (f.action + ' ' + f.environment).match(/[\(\[]\s*(\d+)\s*(s|giây|sec|second)\s*[\)\]]/i);
                let duration = durations[idx] ?? 8;

                if (durationMatch) {
                    const parsed = parseInt(durationMatch[1], 10);
                    if (!isNaN(parsed) && parsed > 0) {
                        duration = Math.min(120, Math.max(2, parsed)); // Relaxed limits for manual override
                    }
                }

                return {
                    ...f,
                    frameNumber: idx + 1,
                    durationSec: duration,
                    aspectRatio: (f.aspectRatio as any) || '9:16',
                };
            });

            return FrameModel.validateArray(frames);

        } catch (error: any) {
            if (error instanceof ApiKeyMissingError) throw error;
            if (error.message?.includes('API key')) {
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

        const labeledRefs = referenceAssets
            .map((a, idx) => {
                const caption = (a.caption || '').trim();
                return `REF_${idx + 1}: ${caption.length ? caption : '(chưa có chú thích)'};`;
            })
            .join('\n');

        const strictRefRules = referenceAssets.length
            ? `\n\nẢNH THAM CHIẾU BỔ SUNG (ngoài ảnh nhân vật):\n${labeledRefs}\n\nQUY TẮC BẮT BUỘC KHI DÙNG ẢNH THAM CHIẾU:\n- Không được bịa, không được tự tạo logo/sản phẩm/nhân vật/khách hàng mới nếu đã có ảnh tham chiếu.\n- Nếu caption của một ảnh nói đó là LOGO (hoặc có chữ/logo/biểu tượng thương hiệu): phải bám sát 100% (hình dạng, chữ, màu, tỉ lệ). Không được biến thể, không stylize, không thay đổi typography.\n- Nếu caption là ảnh sản phẩm: phải giữ đặc trưng sản phẩm (form factor, màu, chi tiết nhận diện).\n- Nếu caption là ảnh khách hàng/người thật: không được thay đổi danh tính, khuôn mặt.\n- Chỉ dùng các ảnh này khi phù hợp với shot; nếu không phù hợp, bỏ qua thay vì bịa.`
            : '';

        const prompt = `Duy trì sự nhất quán tuyệt đối về ngoại hình nhân vật từ ảnh tham chiếu (ảnh đầu tiên).
Tạo SHOT #${frame.frameNumber} cho video content dạng short-form.

Nội dung shot (visual): ${frame.action}
Bối cảnh: ${frame.environment}
Ánh sáng: ${frame.lighting}
Góc máy: ${frame.cameraAngle}
  Text dự kiến để overlay sau (KHÔNG ĐƯỢC render chữ vào ảnh): ${frame.onScreenText || ""}

Yêu cầu:
- Photorealistic, sắc nét, phù hợp phong cách video content quảng cáo.
- Bố cục sạch, chừa khoảng trống hợp lý để đặt chữ (on-screen text).
  - TUYỆT ĐỐI KHÔNG render bất kỳ chữ/câu/ký tự nào lên ảnh (đặc biệt tiếng Việt có dấu). Không subtitles, không watermark, không logo tự bịa.
- Tuyệt đối đúng nhân vật trong ảnh gốc, không đổi cấu trúc khuôn mặt.${strictRefRules}`;

        const character = this.parseDataUrl(characterBase64);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        {
                            inlineData: {
                                data: character.data,
                                mimeType: character.mimeType,
                            },
                        },
                        ...referenceAssets
                            .filter(a => !!a.image)
                            .map(a => {
                                const parsed = this.parseDataUrl(a.image);
                                return {
                                    inlineData: {
                                        data: parsed.data,
                                        mimeType: parsed.mimeType,
                                    },
                                };
                            }),
                        { text: prompt },
                    ],
                },
                config: {
                    imageConfig: {
                        aspectRatio: frame.aspectRatio || "9:16"
                    }
                }
            });

            let imageUrl = '';
            const candidates = response.candidates;
            if (candidates && candidates[0]?.content?.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData) {
                        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }

            // If no inlineData, maybe it returned text error?
            if (!imageUrl) {
                // Fallback check for text if image failed
                const text = candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) throw new Error("AI returned text instead of image: " + text);
                throw new Error("No image data returned");
            }

            return imageUrl;

        } catch (error: any) {
            if (error instanceof ImageGenerationError) throw error;
            if (error instanceof ApiKeyMissingError) throw error;
            throw new ImageGenerationError(frame.frameNumber, error instanceof Error ? error.message : 'Unknown');
        }
    }

    async generateVideo(frame: Frame, onProgress: (msg: string) => void): Promise<string> {
        const ai = this.getClient();

        try {
            // Using Veo model
            if (!frame.imageUrl) throw new VideoGenerationError(frame.frameNumber, "Cần ảnh gốc để tạo video");

            onProgress("Đang khởi tạo yêu cầu Veo 3.1...");

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: `Social short-form video (content ad): ${frame.action}.
No burned-in text, no subtitles, no watermarks (Vietnamese text will be added as overlay later).
Voiceover (if any): ${frame.voiceover || ""}.
CTA: ${frame.cta || ""}.
Lighting: ${frame.lighting}. Camera: ${frame.cameraAngle}. Stable character. Keep it punchy and engaging.`,
                image: {
                    imageBytes: frame.imageUrl!.split(',')[1],
                    mimeType: 'image/png',
                },
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: (frame.aspectRatio || '9:16')
                }
            });

            onProgress("Đang xử lý video content (có thể mất vài phút)...");

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                try {
                    operation = await ai.operations.getVideosOperation({ operation });
                    onProgress("Đang kết xuất clip...");
                } catch (e: any) {
                    if (e.message?.includes("Requested entity was not found")) {
                        throw new ApiKeyInvalidError();
                    }
                    throw e;
                }
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new VideoGenerationError(frame.frameNumber, 'No download link');
            }

            onProgress("Đang tải video xuống...");
            const response = await fetch(`${downloadLink}&key=${encodeURIComponent(this.apiKey)}`);
            const blob = await response.blob();
            return URL.createObjectURL(blob);

        } catch (error: any) {
            if (error instanceof VideoGenerationError) throw error;
            if (error.message?.includes('Requested entity was not found')) {
                throw new ApiKeyInvalidError();
            }
            throw new VideoGenerationError(frame.frameNumber, error instanceof Error ? error.message : 'Unknown');
        }
    }

    async generateScript(request: any): Promise<string> {
        const ai = this.getClient();

        try {
            const prompt = `Bạn là chuyên gia sáng tạo nội dung video ngắn (Shorts/Reels/TikTok).
Hãy viết một KỊCH BẢN PHÂN CẢNH (Shot List) chi tiết dựa trên ý tưởng sau:

CHỦ ĐỀ/Ý TƯỞNG: ${request.topic}
${request.tone ? `TONE/PHONG CÁCH: ${request.tone}` : ''}
${request.market ? `THỊ TRƯỜNG/KHÁN GIẢ: ${request.market} ${request.targetAudience ? `(${request.targetAudience})` : ''}` : ''}
${request.language ? `NGÔN NGỮ: ${request.language}` : ''}

YÊU CẦU ĐẦU RA:
- Trả về KỊCH BẢN dưới dạng văn bản thô (text), mô tả từng cảnh.
- Mỗi cảnh nên có mô tả hình ảnh (Visual) và lời thoại/text (Audio/Text).
- Nếu có thể, hãy ước lượng thời lượng cho từng cảnh và ghi chú vào, ví dụ: (5s).
- Viết hấp dẫn, giữ chân người xem, phù hợp với nền tảng video ngắn.
- KHÔNG trả về JSON, chỉ trả về văn bản kịch bản để người dùng đọc và chỉnh sửa.

ĐỊNH DẠNG MONG MUỐN:
Visual: [Mô tả hình ảnh] (5s)
Audio: [Lời bình/Thoại]
Text: [Text trên màn hình]
... (tiếp tục các cảnh)`;

            const result = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt
            });

            return result.text || '';
        } catch (error: any) {
            if (error instanceof ApiKeyMissingError) throw error;
            throw new Error(error.message || "Failed to generate script");
        }
    }

}
