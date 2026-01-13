
import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import CharacterPanel from './components/CharacterPanel';
import ScriptPanel from './components/ScriptPanel';
import FrameCard from './components/FrameCard';
import ReferenceAssetsPanel from './components/ReferenceAssetsPanel';
import { GeminiService } from './services/geminiService';
import { ContentState, FrameData } from './types';

// The aistudio property is already defined in the global environment.
// We use type casting where needed to access its methods to avoid conflicting declarations.

const App: React.FC = () => {
  const [state, setState] = useState<ContentState>({
    characterImage: null,
    referenceAssets: [],
    targetDurationSec: 30,
    script: '',
    frames: [],
    isProcessingScript: false,
  });

  const gemini = useMemo(() => new GeminiService(), []);

  const handleProcessScript = async () => {
    if (!state.script || state.isProcessingScript) return;

    setState(prev => ({ ...prev, isProcessingScript: true, frames: [] }));
    try {
      const frames = await gemini.parseScriptIntoFrames(state.script, state.targetDurationSec);
      setState(prev => ({ ...prev, frames, isProcessingScript: false }));
    } catch (error) {
      console.error(error);
      alert("Lỗi khi phân tích kịch bản. Vui lòng thử lại.");
      setState(prev => ({ ...prev, isProcessingScript: false }));
    }
  };

  const handleGenerateFrameImage = async (frameNumber: number) => {
    const frameIndex = state.frames.findIndex(f => f.frameNumber === frameNumber);
    if (frameIndex === -1 || !state.characterImage) return;

    // Start simulating progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1 && nextFrames[idx].isGenerating) {
          // Slow down as it gets closer to 95%
          const increment = progress < 70 ? 5 : progress < 90 ? 2 : 0.5;
          progress = Math.min(progress + increment, 95);
          nextFrames[idx] = { ...nextFrames[idx], imageProgress: Math.floor(progress) };
        }
        return { ...prev, frames: nextFrames };
      });
    }, 400);

    setState(prev => {
      const nextFrames = [...prev.frames];
      nextFrames[frameIndex] = { ...nextFrames[frameIndex], isGenerating: true, imageProgress: 0 };
      return { ...prev, frames: nextFrames };
    });

    try {
      const imageUrl = await gemini.generateFrameImage(
        state.frames[frameIndex],
        state.characterImage,
        state.referenceAssets
      );
      clearInterval(progressInterval);
      
      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1) {
          nextFrames[idx] = { ...nextFrames[idx], imageUrl, isGenerating: false, imageProgress: 100 };
        }
        return { ...prev, frames: nextFrames };
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error(error);
      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1) {
          nextFrames[idx] = { ...nextFrames[idx], isGenerating: false, imageProgress: undefined };
        }
        return { ...prev, frames: nextFrames };
      });
      alert("Lỗi khi tạo visual cho shot.");
    }
  };

  const handleGenerateVideo = async (frameNumber: number) => {
    const frameIndex = state.frames.findIndex(f => f.frameNumber === frameNumber);
    if (frameIndex === -1) return;

    // Check for Veo API Key - with fallback for running outside AI Studio
    const aistudio = (window as any).aistudio;
    if (aistudio?.hasSelectedApiKey) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("Để tạo video bằng Veo 3.1, bạn cần chọn một API Key từ dự án có trả phí (Paid GCP project).");
        await aistudio.openSelectKey();
      }
    } else {
      // Running outside AI Studio - check if API key is configured
      if (!process.env.API_KEY || process.env.API_KEY === 'PLACEHOLDER_API_KEY') {
        alert("Vui lòng cấu hình GEMINI_API_KEY trong file .env.local với API key từ dự án có trả phí (Paid GCP project).");
        return;
      }
    }

    const updatedFrames = [...state.frames];
    updatedFrames[frameIndex].isGeneratingVideo = true;
    updatedFrames[frameIndex].videoProgress = "Đang kết nối Veo 3.1...";
    setState(prev => ({ ...prev, frames: updatedFrames }));

    try {
      const videoUrl = await gemini.generateVideo(
        state.frames[frameIndex], 
        (msg) => {
          setState(prev => {
            const nextFrames = [...prev.frames];
            const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
            if (idx !== -1) {
              nextFrames[idx].videoProgress = msg;
            }
            return { ...prev, frames: nextFrames };
          });
        }
      );

      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1) {
          nextFrames[idx] = { ...nextFrames[idx], videoUrl, isGeneratingVideo: false, videoProgress: undefined };
        }
        return { ...prev, frames: nextFrames };
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === "KEY_RESET_REQUIRED") {
        const aistudio = (window as any).aistudio;
        if (aistudio?.openSelectKey) {
          alert("Phiên làm việc hết hạn hoặc lỗi Key. Vui lòng chọn lại API Key.");
          await aistudio.openSelectKey();
        } else {
          alert("Phiên làm việc hết hạn hoặc lỗi Key. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env.local và restart server.");
        }
      } else {
        alert("Lỗi khi tạo video bằng Veo 3.1: " + error.message);
      }
      
      setState(prev => {
        const nextFrames = [...prev.frames];
        const idx = nextFrames.findIndex(f => f.frameNumber === frameNumber);
        if (idx !== -1) {
          nextFrames[idx].isGeneratingVideo = false;
          nextFrames[idx].videoProgress = undefined;
        }
        return { ...prev, frames: nextFrames };
      });
    }
  };

  const generateAllVisible = async () => {
    if (!state.characterImage) {
      alert("Vui lòng tải lên ảnh nhân vật trước.");
      return;
    }
    for (const frame of state.frames) {
      if (!frame.imageUrl && !frame.isGenerating) {
        await handleGenerateFrameImage(frame.frameNumber);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <Header />
      
      <main className="flex-grow flex flex-col lg:flex-row p-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Sidebar trái: Cấu hình */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <CharacterPanel 
            image={state.characterImage} 
            onImageChange={(img) => setState(p => ({ ...p, characterImage: img }))} 
          />
          <ReferenceAssetsPanel
            assets={state.referenceAssets}
            onChange={(assets) => setState(p => ({ ...p, referenceAssets: assets }))}
          />
          <ScriptPanel 
            script={state.script}
            onScriptChange={(script) => setState(p => ({ ...p, script }))}
            targetDurationSec={state.targetDurationSec}
            onTargetDurationChange={(sec) => setState(p => ({ ...p, targetDurationSec: Math.max(8, Math.min(120, sec)) }))}
            onProcess={handleProcessScript}
            isProcessing={state.isProcessingScript}
            canProcess={!!state.script && !!state.characterImage}
          />
          
          <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="fa-solid fa-circle-info"></i>
              Thông tin Veo 3.1
            </h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Tính năng tạo video yêu cầu API Key từ dự án Paid. Mỗi video 720p mất khoảng 1-3 phút để hoàn thành.
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block mt-1 text-indigo-400 underline">Tài liệu thanh toán</a>
            </p>
          </div>
        </aside>

        {/* Nội dung phải: Lưới shot */}
        <section className="flex-grow">
          {state.frames.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-bold">Shot List Video Content</h2>
                  <span className="text-sm text-gray-500 uppercase tracking-tighter">
                      {state.frames.length} shot
                  </span>
                </div>
                <button 
                  onClick={generateAllVisible}
                  className="px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm font-semibold hover:bg-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <i className="fa-solid fa-play"></i>
                    Tạo Tất Cả Visual
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {state.frames.map((frame) => (
                  <FrameCard 
                    key={frame.frameNumber} 
                    frame={frame} 
                    onGenerateImage={() => handleGenerateFrameImage(frame.frameNumber)}
                    onGenerateVideo={() => handleGenerateVideo(frame.frameNumber)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <i className="fa-solid fa-film text-3xl text-gray-700"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-300 mb-2">Chưa có Shot List nào</h3>
              <p className="text-gray-500 max-w-sm mb-8">
                Tải lên ảnh nhân vật và dán kịch bản/nội dung để tạo shot list video content, sau đó tạo visual và clip với Veo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold uppercase tracking-widest text-gray-600">
                <div className="flex flex-col gap-2 items-center">
                  <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center">1</div>
                  Ảnh tham chiếu
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center">2</div>
                  Nhập nội dung
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center">3</div>
                  Tạo clip
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Thanh công cụ nổi */}
      {state.frames.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pr-6 border-r border-white/10">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Trạng thái:</span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Nội dung đã tải</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const aistudio = (window as any).aistudio;
                if (aistudio?.openSelectKey) {
                  aistudio.openSelectKey();
                } else {
                  alert("Để đổi API Key, vui lòng chỉnh sửa file .env.local và restart server.\n\nĐường dẫn: GEMINI_API_KEY=your_api_key_here");
                }
              }}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-key"></i>
              Đổi API Key
            </button>
            <button 
              onClick={() => window.print()}
              className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-print"></i>
              Xuất PDF
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, frames: [] }))}
              className="text-xs font-bold text-red-500/70 hover:text-red-500 flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-trash-can"></i>
              Xóa tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
