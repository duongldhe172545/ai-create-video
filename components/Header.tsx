
import React from 'react';

const Header: React.FC = () => {
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
        <div className="flex items-center gap-4 text-xs text-gray-400 uppercase tracking-widest font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Hệ Thống Sẵn Sàng
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
