
import React from 'react';
import { FrameData } from '../types';

interface FrameCardProps {
  frame: FrameData;
  onGenerateImage: () => void;
  onGenerateVideo: () => void;
}

const FrameCard: React.FC<FrameCardProps> = ({ frame, onGenerateImage, onGenerateVideo }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    if (frame.videoUrl) {
      link.href = frame.videoUrl;
      link.download = `Shot_${frame.frameNumber}.mp4`;
    } else if (frame.imageUrl) {
      link.href = frame.imageUrl;
      link.download = `Shot_${frame.frameNumber}.png`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden group flex flex-col h-full shadow-lg hover:border-indigo-500/30 transition-all">
      <div className="aspect-[9/16] bg-black relative flex items-center justify-center overflow-hidden">
        {frame.videoUrl ? (
          <video 
            src={frame.videoUrl} 
            controls 
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
          />
        ) : frame.imageUrl ? (
          <div className="w-full h-full relative group/img">
            <img src={frame.imageUrl} alt={`Cảnh ${frame.frameNumber}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover/img:bg-transparent transition-colors"></div>
          </div>
        ) : frame.isGenerating ? (
          <div className="flex flex-col items-center gap-4 w-full px-8">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={175.9}
                  strokeDashoffset={175.9 - (175.9 * (frame.imageProgress || 0)) / 100}
                  className="text-indigo-500 transition-all duration-300"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-white">
                {frame.imageProgress || 0}%
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse">Đang kết xuất...</span>
              <span className="text-[8px] text-gray-500 italic">Duy trì sự nhất quán nhân vật</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={onGenerateImage}
            className="flex flex-col items-center gap-3 hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors">
              <i className="fa-solid fa-wand-magic-sparkles text-xl text-gray-600 group-hover:text-indigo-400"></i>
            </div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Tạo Hình Ảnh</span>
          </button>
        )}

        {frame.isGeneratingVideo && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-white font-bold uppercase tracking-widest mb-2">Veo 3.1 Generating</p>
            <p className="text-[10px] text-indigo-400 animate-pulse">{frame.videoProgress || "Đang kết nối..."}</p>
          </div>
        )}

        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white/70 border border-white/10 uppercase z-10">
          Shot {frame.frameNumber} • {(frame.aspectRatio || '9:16')}
        </div>

        {/* Nút tải xuống */}
        {(frame.imageUrl || frame.videoUrl) && !frame.isGeneratingVideo && (
          <button 
            onClick={handleDownload}
            className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 border border-white/10 hover:bg-indigo-600 hover:text-white transition-all z-10 shadow-lg"
            title="Tải xuống"
          >
            <i className="fa-solid fa-download text-xs"></i>
          </button>
        )}

        {frame.imageUrl && !frame.videoUrl && !frame.isGeneratingVideo && (
          <button 
            onClick={onGenerateVideo}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg shadow-black/50 z-10 border border-white/10"
          >
            <i className="fa-solid fa-play-circle text-sm"></i>
            Tạo Clip (Veo)
          </button>
        )}
      </div>

      <div className="p-4 space-y-3 flex-grow">
        <div className="space-y-1">
          <span className="text-[9px] text-gray-500 font-bold uppercase block">Text màn hình</span>
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{frame.onScreenText || "(chưa có)"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase block">Góc quay</span>
            <span className="text-[11px] text-gray-300 block line-clamp-1">{frame.cameraAngle}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase block">Ánh sáng</span>
            <span className="text-[11px] text-gray-300 block line-clamp-1">{frame.lighting}</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-gray-500 font-bold uppercase block">Visual / Hành động</span>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 italic">{frame.action}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase block">Voiceover</span>
            <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{frame.voiceover || "(tuỳ chọn)"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase block">CTA</span>
            <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{frame.cta || "(tuỳ chọn)"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="uppercase font-bold tracking-widest">Thời lượng</span>
          <span className="text-gray-400 font-semibold">{frame.durationSec ? `${frame.durationSec}s` : "(chưa có)"}</span>
        </div>
      </div>
      
      <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2 bg-white/[0.02]">
        <i className="fa-solid fa-volume-low text-[10px] text-gray-600"></i>
        <span className="text-[10px] text-gray-500 italic truncate flex-grow">{frame.sound || "Không có âm thanh"}</span>
      </div>
    </div>
  );
};

export default FrameCard;
