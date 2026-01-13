import React, { useCallback, useRef, useState } from 'react';
import { ReferenceAsset } from '../types';

interface ReferenceAssetsPanelProps {
  assets: ReferenceAsset[];
  onChange: (next: ReferenceAsset[]) => void;
}

const makeId = () => {
  // crypto.randomUUID is supported in modern browsers; fallback just in case.
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ReferenceAssetsPanel: React.FC<ReferenceAssetsPanelProps> = ({ assets, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const readAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Không thể đọc file'));
          reader.readAsDataURL(file);
        });

      const next: ReferenceAsset[] = [...assets];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await readAsDataUrl(file);
        next.push({ id: makeId(), image: dataUrl, caption: '' });
      }
      onChange(next);
      setIsOpen(true);
      if (inputRef.current) inputRef.current.value = '';
    },
    [assets, onChange]
  );

  const updateCaption = useCallback(
    (id: string, caption: string) => {
      onChange(assets.map(a => (a.id === id ? { ...a, caption } : a)));
    },
    [assets, onChange]
  );

  const removeAsset = useCallback(
    (id: string) => {
      onChange(assets.filter(a => a.id !== id));
    },
    [assets, onChange]
  );

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <div className="bg-[#111] rounded-xl border border-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          className="flex items-center gap-2 text-left"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Ảnh Tham Chiếu Bổ Sung
          </h3>
          <span className="text-[10px] text-gray-500">({assets.length})</span>
          <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-[10px] text-gray-600`}></i>
        </button>

        {assets.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Xoá hết
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="flex-1 cursor-pointer px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors">
          <i className="fa-solid fa-upload mr-2 text-gray-500"></i>
          Tải nhiều ảnh (logo, sản phẩm, khách hàng...)
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold hover:bg-indigo-600/20 transition-all"
        >
          Mở
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3">
          {assets.length === 0 ? (
            <div className="text-[11px] text-gray-500 leading-relaxed border border-white/5 rounded-lg p-3 bg-black/20">
              Thêm ảnh và viết chú thích để AI hiểu vai trò của ảnh (ví dụ: “logo thương hiệu”, “ảnh sản phẩm A”, “khách hàng thật”).
              Nếu chú thích là logo, AI sẽ được nhắc phải bám sát 100% và không được tự bịa.
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="flex gap-3 items-start border border-white/5 rounded-xl p-3 bg-black/20">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={asset.image} alt="ref" className="w-full h-full object-cover" />
                </div>

                <div className="flex-grow space-y-2">
                  <input
                    value={asset.caption}
                    onChange={(e) => updateCaption(asset.id, e.target.value)}
                    placeholder="Chú thích (vd: logo thương hiệu, sản phẩm X, khách hàng Y...)"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Gợi ý: viết rõ “ĐÂY LÀ LOGO” / “ĐÂY LÀ SẢN PHẨM” để AI bám sát.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeAsset(asset.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
                  title="Xoá"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))
          )}

          <p className="text-[10px] text-gray-500 italic leading-tight">
            * Các ảnh này là tuỳ chọn. Không ảnh hưởng luồng cũ; bạn vẫn chỉ cần ảnh nhân vật + kịch bản để tạo shot list.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReferenceAssetsPanel;
