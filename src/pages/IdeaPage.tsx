import React, { useState } from 'react';
import IdeaInputPanel from '../components/IdeaInputPanel';
import ConsultantChatWidget from '../components/ConsultantChatWidget';
import { ScriptRequest } from '../entities/models/script-request.model';
import { ConsultIdeaUseCase } from '../application/use-cases/consult-idea.use-case';

interface IdeaPageProps {
    onGenerateScript: (request: ScriptRequest, apiKey: string) => Promise<void>;
    isGenerating: boolean;
    consultUseCase: ConsultIdeaUseCase;
    onNavigateToDashboard: () => void;
    openAIKey: string;
    onOpenAIKeyChange: (key: string) => void;
}

const IdeaPage: React.FC<IdeaPageProps> = ({
    onGenerateScript,
    isGenerating,
    consultUseCase,
    onNavigateToDashboard,
    openAIKey,
    onOpenAIKeyChange
}) => {
    const [showKeyInput, setShowKeyInput] = useState(!openAIKey);

    const handleGenerate = async (req: ScriptRequest) => {
        if (!openAIKey) {
            alert("Vui lòng nhập OpenAI API Key để tạo kịch bản.");
            setShowKeyInput(true);
            return;
        }
        await onGenerateScript(req, openAIKey);
        onNavigateToDashboard();
    };

    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>

            {/* OpenAI Key Input (Top Right or Central if missing) */}
            <div className="absolute top-6 right-6 z-50">
                <div className={`flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-full transition-all ${showKeyInput ? 'w-80' : 'w-auto'}`}>
                    <button
                        onClick={() => setShowKeyInput(!showKeyInput)}
                        className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 hover:bg-emerald-500"
                        title="Cấu hình OpenAI Key"
                    >
                        <i className="fa-solid fa-key"></i>
                    </button>
                    {showKeyInput && (
                        <input
                            type="password"
                            className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder-gray-500 mr-2"
                            placeholder="Nhập OpenAI Key (sk-...)"
                            value={openAIKey}
                            onChange={(e) => onOpenAIKeyChange(e.target.value)}
                        />
                    )}
                </div>
            </div>

            <div className="max-w-2xl w-full z-10 space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                        AI CREATIVE STUDIO
                    </h1>
                    <p className="text-gray-400">Powered by OpenAI GPT-5.2</p>
                </div>

                <IdeaInputPanel
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                />

                <div className="text-center">
                    <button
                        onClick={onNavigateToDashboard}
                        className="text-gray-500 hover:text-white text-sm underline underline-offset-4"
                    >
                        Bỏ qua, đi tới Dashboard làm phim &rarr;
                    </button>
                </div>
            </div>

            <ConsultantChatWidget
                consultUseCase={consultUseCase}
                openAIKey={openAIKey}
                onOpenAIKeyChange={onOpenAIKeyChange}
            />
        </div>
    );
};

export default IdeaPage;
