
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FrameData, ReferenceAsset } from "../types";

export class GeminiService {
  constructor() {}

  private parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      // Fallback: assume png if we can't parse.
      return { mimeType: 'image/png', data: dataUrl };
    }
    return { mimeType: match[1], data: match[2] };
  }

  private withApiKey(url: string): string {
    const key = process.env.API_KEY;
    if (!key) return url;
    if (url.includes('key=')) return url;
    return `${url}${url.includes('?') ? '&' : '?'}key=${key}`;
  }

  private async uploadVideoForExtension(
    ai: GoogleGenAI,
    blob: Blob,
    displayName?: string
  ): Promise<{ uri: string; name?: string }> {
    // NOTE: ai.files.upload is Gemini API only (not Vertex). In browser we can pass a Blob.
    const mimeType = blob.type || 'video/mp4';
    const file = await ai.files.upload({
      file: blob,
      config: {
        mimeType,
        displayName: displayName || 'generated-video.mp4',
      },
    });

    const uri = file.uri;
    if (!uri) {
      throw new Error(`Upload video thành công nhưng không nhận được uri (file.name=${file.name || ''})`);
    }
    return { uri, name: file.name };
  }

  private buildShotDurations(targetDurationSec: number): number[] {
    // Prefer 8s shots; avoid very short shots (e.g. 2-3s).
    const total = Math.max(8, Math.min(120, Math.round(targetDurationSec || 30)));
    const maxShot = 8;
    const minShot = 5;

    const shotCount = Math.max(1, Math.ceil(total / maxShot));
    const durations = new Array(shotCount).fill(maxShot);
    durations[shotCount - 1] = total - maxShot * (shotCount - 1);

    // If the last shot is too short, transfer seconds from earlier 8s.
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

    // Hard clamp just in case.
    return durations.map(d => Math.max(minShot, Math.min(maxShot, Math.round(d))));
  }

  async parseScriptIntoFrames(script: string, targetDurationSec: number = 30): Promise<FrameData[]> {
    // Always create a new GoogleGenAI instance right before making an API call to use the most up-to-date key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const clampedTarget = Math.max(8, Math.min(120, Math.round(targetDurationSec || 30)));
    const durations = this.buildShotDurations(clampedTarget);
    const shotCount = durations.length;
    const durationsList = durations.join('-');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    try {
      const parsed = JSON.parse(response.text || '[]') as FrameData[];
      if (!Array.isArray(parsed) || parsed.length === 0) return [];

      // Ensure exact shot count (prefer trimming; pad if model returns fewer).
      let frames: FrameData[] = parsed.slice(0, shotCount);
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
          });
        }
      }

      // Normalize frameNumber and enforce our duration plan.
      frames = frames.map((f, idx) => ({
        ...f,
        frameNumber: idx + 1,
        durationSec: durations[idx] ?? 8,
        aspectRatio: (f.aspectRatio as any) || '9:16',
      }));

      return frames;
    } catch (e) {
      console.error("Lỗi phân tích JSON kịch bản", e);
      return [];
    }
  }

  async generateFrameImage(
    frame: FrameData,
    characterBase64: string,
    referenceAssets: ReferenceAsset[] = []
  ): Promise<string> {
    // Always create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    if (!imageUrl) throw new Error("Không thể tạo hình ảnh");
    return imageUrl;
  }

  async generateVideo(
    frame: FrameData,
    onProgress: (msg: string) => void
  ): Promise<{ videoUrl: string; videoSourceUri: string }> {
    // Always create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!frame.imageUrl) throw new Error("Cần ảnh gốc để tạo video");

    onProgress("Đang khởi tạo yêu cầu Veo 3.1...");
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Social short-form video (content ad): ${frame.action}.
No burned-in text, no subtitles, no watermarks (Vietnamese text will be added as overlay later).
Voiceover (if any): ${frame.voiceover || ""}.
CTA: ${frame.cta || ""}.
Lighting: ${frame.lighting}. Camera: ${frame.cameraAngle}. Stable character. Keep it punchy and engaging.`,
      image: {
        imageBytes: frame.imageUrl.split(',')[1],
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
        operation = await ai.operations.getVideosOperation({ operation: operation });
        onProgress("Đang kết xuất clip...");
      } catch (e: any) {
        if (e.message?.includes("Requested entity was not found")) {
          throw new Error("KEY_RESET_REQUIRED");
        }
        throw e;
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      const filtered = operation.response?.raiMediaFilteredCount;
      const reasons = operation.response?.raiMediaFilteredReasons;
      const opError = (operation as any).error;
      const hint = opError ? ` Operation error: ${JSON.stringify(opError)}` : '';
      const raiHint = filtered
        ? ` RAI filtered count=${filtered}, reasons=${JSON.stringify(reasons || [])}`
        : '';
      throw new Error(`Không tìm thấy link tải video.${raiHint}${hint}`);
    }

    onProgress("Đang tải video xuống...");
    const response = await fetch(this.withApiKey(downloadLink));
    const blob = await response.blob();

    // For future "extend" calls, veo models often require a stable URI rather than inline bytes.
    // Upload the generated clip to Gemini Files to get a supported URI.
    try {
      onProgress('Đang upload clip để có URI ổn định (phục vụ extend)...');
      const uploaded = await this.uploadVideoForExtension(
        ai,
        blob,
        `shot-${frame.frameNumber || 0}.mp4`
      );
      return { videoUrl: URL.createObjectURL(blob), videoSourceUri: uploaded.uri };
    } catch (e) {
      console.warn('Upload video for extension failed; falling back to downloadLink as videoSourceUri', e);
      return { videoUrl: URL.createObjectURL(blob), videoSourceUri: downloadLink };
    }
  }

  async extendVideo(
    frame: FrameData,
    extendSeconds: number,
    onProgress: (msg: string) => void
  ): Promise<{ videoUrl: string; videoSourceUri: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!frame.videoSourceUri && !frame.videoUrl) {
      throw new Error('Cần clip đã tạo (videoUrl/videoSourceUri) để extend');
    }

    const seconds = Math.max(1, Math.min(16, Math.round(extendSeconds || 8)));
    onProgress(`Đang extend clip thêm ${seconds}s...`);

    const prompt = `Continue/extend the same scene seamlessly. Maintain the same character identity, clothing, lighting, camera style, and environment continuity. No burned-in text, no subtitles, no watermarks.`;

    // IMPORTANT:
    // Some Veo models do NOT support inline video bytes (encodedVideo/videoBytes).
    // They only accept `video.uri`. So we ensure we always provide a supported URI.

    const tryExtendWithUri = async (videoUri: string) => {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        video: { uri: videoUri, mimeType: 'video/mp4' },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: (frame.aspectRatio || '9:16'),
          durationSeconds: seconds,
        },
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        onProgress('Đang kết xuất clip (extend)...');
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        const filtered = operation.response?.raiMediaFilteredCount;
        const reasons = operation.response?.raiMediaFilteredReasons;
        const opError = (operation as any).error;
        const hint = opError ? ` Operation error: ${JSON.stringify(opError)}` : '';
        const raiHint = filtered
          ? ` RAI filtered count=${filtered}, reasons=${JSON.stringify(reasons || [])}`
          : '';
        throw new Error(`Không tìm thấy link tải video (extend).${raiHint}${hint}`);
      }

      const response = await fetch(this.withApiKey(downloadLink));
      const outBlob = await response.blob();

      // Upload extended result as well to get a stable URI for chaining.
      try {
        onProgress('Đang upload clip đã extend để có URI ổn định...');
        const uploadedOut = await this.uploadVideoForExtension(
          ai,
          outBlob,
          `shot-${frame.frameNumber || 0}-extended.mp4`
        );
        return { videoUrl: URL.createObjectURL(outBlob), videoSourceUri: uploadedOut.uri };
      } catch (e) {
        console.warn('Upload extended video failed; returning downloadLink as source', e);
        return { videoUrl: URL.createObjectURL(outBlob), videoSourceUri: downloadLink };
      }
    };

    // 1) Try using whatever URI we already have.
    if (frame.videoSourceUri) {
      try {
        return await tryExtendWithUri(frame.videoSourceUri);
      } catch (e: any) {
        const msg = String(e?.message || e);
        // If uri is not acceptable, we'll upload to Files and retry.
        console.warn('Extend by existing uri failed; will try upload+uri', e);
        if (msg.includes("encodedVideo") || msg.includes("videoBytes")) {
          // Should not happen now (we never send videoBytes), but keep a helpful hint.
          onProgress('Model không hỗ trợ encodedVideo/videoBytes; chuyển sang upload để lấy URI...');
        }
      }
    }

    // 2) Upload the clip we have (blob URL or downloadLink) to Gemini Files to obtain a supported URI.
    onProgress('Đang chuẩn bị upload clip để extend...');
    let inputBlob: Blob | undefined;
    if (frame.videoUrl) {
      inputBlob = await (await fetch(frame.videoUrl)).blob();
    } else if (frame.videoSourceUri) {
      // As a last resort, download by source URI.
      inputBlob = await (await fetch(this.withApiKey(frame.videoSourceUri))).blob();
    }
    if (!inputBlob) {
      throw new Error('Không thể tải blob video để upload (thiếu videoUrl/videoSourceUri)');
    }

    onProgress('Đang upload clip lên Gemini Files...');
    const uploadedIn = await this.uploadVideoForExtension(
      ai,
      inputBlob,
      `shot-${frame.frameNumber || 0}-input.mp4`
    );

    return await tryExtendWithUri(uploadedIn.uri);
  }
}
