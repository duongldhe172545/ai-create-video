
import React from 'react';

interface ScriptPanelProps {
  script: string;
  onScriptChange: (val: string) => void;
  targetDurationSec: number;
  onTargetDurationChange: (sec: number) => void;
  onProcess: () => void;
  isProcessing: boolean;
  canProcess: boolean;
}

const ScriptPanel: React.FC<ScriptPanelProps> = ({
  script,
  onScriptChange,
  targetDurationSec,
  onTargetDurationChange,
  onProcess,
  isProcessing,
  canProcess,
}) => {
  const presets = [8, 15, 30, 45, 60, 90, 120];

  return (
    <div className="bg-[#111] rounded-xl border border-white/5 p-6 flex flex-col h-full">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Kịch Bản / Nội Dung Video
      </h3>

      <div className="flex items-center justify-between gap-3 mb-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Thời lượng dự kiến
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={8}
            max={120}
            step={1}
            value={targetDurationSec}
            onChange={(e) => onTargetDurationChange(Number(e.target.value))}
            className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          <span className="text-xs text-gray-500">giây</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => onTargetDurationChange(sec)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              targetDurationSec === sec
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            {sec}s
          </button>
        ))}
      </div>

      <textarea
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        placeholder="Dán kịch bản/nội dung video vào đây... Ví dụ: 'Giới thiệu tính năng cửa Austdoor: chống ồn, cách nhiệt, bền bỉ. Kết thúc kêu gọi inbox để tư vấn...'"
        className="flex-grow w-full bg-black/30 border border-white/5 rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none mb-4 min-h-[300px] custom-scrollbar"
      />
      <button
        onClick={onProcess}
        disabled={!canProcess || isProcessing}
        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
          canProcess && !isProcessing
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
        }`}
      >
        {isProcessing ? (
          <>
            <i className="fa-solid fa-spinner fa-spin"></i>
            Đang tạo shot list...
          </>
        ) : (
          <>
            <i className="fa-solid fa-bolt"></i>
            Tạo Shot List
          </>
        )}
      </button>
    </div>
  );
};

export default ScriptPanel;
