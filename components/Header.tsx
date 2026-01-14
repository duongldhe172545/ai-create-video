
import React from 'react';

type HeaderProps = {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
};

const Header: React.FC<HeaderProps> = ({ apiKey, onApiKeyChange }) => {
  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-clapperboard text-white text-sm"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Dương-ai-video <span className="text-xs font-normal text-indigo-400 border border-indigo-400/30 px-1.5 py-0.5 rounded ml-1 uppercase">AI VIDEO</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 uppercase tracking-widest font-semibold">
            <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {apiKey ? 'API Key: Đã nhập' : 'API Key: Chưa có'}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              type="password"
              placeholder="Nhập Gemini API key..."
              className="w-[240px] md:w-[320px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              autoComplete="off"
              spellCheck={false}
            />
            {apiKey ? (
              <button
                onClick={() => onApiKeyChange('')}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors"
                title="Xóa API key"
              >
                Xóa
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
