import React, { useState } from 'react';
import { ScriptRequest } from '../entities/models/script-request.model';

interface IdeaInputPanelProps {
    onGenerate: (request: ScriptRequest) => Promise<void>;
    isGenerating: boolean;
}

const IdeaInputPanel: React.FC<IdeaInputPanelProps> = ({ onGenerate, isGenerating }) => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState<string>('Cuốn hút');
    const [market, setMarket] = useState<string>('Vietnam');
    const [language, setLanguage] = useState<string>('Tiếng Việt');
    const [targetAudience, setTargetAudience] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        onGenerate({
            topic: topic.trim(),
            tone,
            market,
            language,
            targetAudience: targetAudience.trim() || undefined,
        });
    };

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-lightbulb"></i>
                    Ý Tưởng &rarr; Kịch Bản
                </span>
                <i className={`fa-solid fa-chevron-down text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
            </div>

            {isExpanded && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Mô tả Ý tưởng / Sản phẩm</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                            placeholder="Ví dụ: Video review iPhone 16 Pro Max tập trung vào tính năng quay phim..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Phong cách (Tone)</label>
                            <select
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                            >
                                <option value="Hài hước">Hài hước</option>
                                <option value="Nghiêm túc">Nghiêm túc</option>
                                <option value="Kịch tính">Kịch tính / Drama</option>
                                <option value="Sôi động">Sôi động</option>
                                <option value="Truyền cảm hứng">Truyền cảm hứng</option>
                                <option value="Review chân thực">Review chân thực</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Thị trường</label>
                            <select
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                                value={market}
                                onChange={(e) => setMarket(e.target.value)}
                            >
                                <option value="Vietnam">Việt Nam 🇻🇳</option>
                                <option value="US">Mỹ (US) 🇺🇸</option>
                                <option value="Global">Toàn cầu 🌍</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Khán giả mục tiêu</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                            placeholder="Gen Z, Dân văn phòng, Nội trợ..."
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isGenerating || !topic.trim()}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-white text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                Đang Viết Kịch Bản...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                Tạo Kịch Bản Mẫu
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default IdeaInputPanel;
