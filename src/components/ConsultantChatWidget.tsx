import React, { useState, useEffect, useRef } from 'react';
import { ConsultIdeaUseCase } from '../application/use-cases/consult-idea.use-case';
import { ConsultantMessage } from '../entities/models/consultant-message.model';

interface ConsultantChatWidgetProps {
    consultUseCase: ConsultIdeaUseCase;
    openAIKey: string;
    onOpenAIKeyChange: (key: string) => void;
}

const ConsultantChatWidget: React.FC<ConsultantChatWidgetProps> = ({
    consultUseCase,
    openAIKey,
    onOpenAIKeyChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ConsultantMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !openAIKey) return;

        const userMsg: ConsultantMessage = { role: 'user', content: input };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const result = await consultUseCase.execute(newHistory, openAIKey);
            setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'system', content: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed z-50 transition-all duration-300 ${isOpen ? 'bottom-6 right-6 w-96 h-[500px]' : 'bottom-6 right-6 w-14 h-14'}`}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-emerald-500 transition-colors animate-bounce"
                >
                    <i className="fa-solid fa-comments text-xl"></i>
                </button>
            )}

            {isOpen && (
                <div className="w-full h-full bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-emerald-900/40 p-3 border-b border-emerald-500/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <h3 className="font-bold text-gray-200 text-sm">AI Consultant (GPT-5.2)</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Config Key (if empty) */}
                    {!openAIKey && (
                        <div className="p-4 bg-yellow-900/20 text-center">
                            <p className="text-xs text-yellow-500 mb-2">Cần nhập OpenAI API Key</p>
                            <input
                                type="password"
                                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                placeholder="sk-..."
                                onChange={(e) => onOpenAIKeyChange(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-600 text-xs mt-10">
                                Chào bạn! Tôi là trợ lý ảo sáng tạo. Cần tôi tìm ý tưởng gì không?
                            </div>
                        )}
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user'
                                        ? 'bg-emerald-600/80 text-white rounded-br-none'
                                        : m.role === 'system'
                                            ? 'bg-red-900/50 text-red-200'
                                            : 'bg-white/10 text-gray-200 rounded-bl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 p-3 rounded-lg rounded-bl-none text-gray-400 text-xs flex items-center gap-1">
                                    Typing <span className="animate-pulse">...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-white/5 bg-black/40">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                                placeholder="Hỏi tư vấn..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!openAIKey || isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!openAIKey || isLoading || !input.trim()}
                                className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantChatWidget;
