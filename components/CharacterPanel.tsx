
import React from 'react';

interface CharacterPanelProps {
  image: string | null;
  onImageChange: (base64: string) => void;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ image, onImageChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[#111] rounded-xl border border-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Nhân Vật Chính
        </h3>
        {image && (
          <button 
            onClick={() => onImageChange('')}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Đặt lại
          </button>
        )}
      </div>

      {!image ? (
        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-white/5 cursor-pointer transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <i className="fa-solid fa-user-plus text-3xl text-gray-600 mb-3"></i>
            <p className="text-xs text-gray-400 text-center px-4">
              Nhấp hoặc kéo thả để tải ảnh nhân vật tham chiếu
            </p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
          <img src={image} alt="Character" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <label className="cursor-pointer bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/20 hover:bg-white/20 transition-colors">
              Thay đổi ảnh
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
        </div>
      )}
      <p className="text-[10px] text-gray-500 italic leading-tight">
        * Cung cấp ảnh chân dung hoặc toàn thân rõ ràng để duy trì sự nhất quán về danh tính nhân vật trong suốt các shot.
      </p>
    </div>
  );
};

export default CharacterPanel;
