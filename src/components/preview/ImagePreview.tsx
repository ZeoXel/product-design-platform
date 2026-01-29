import React, { useRef } from 'react';
import type { ImageVersion } from '../../types';

interface ImagePreviewProps {
  currentImage: ImageVersion | null;
  isGenerating: boolean;
  progress?: number;
  onUpload?: (file: File) => void;
  onGalleryOpen?: () => void;
  onExport?: () => void;
  onClear?: () => void;  // 清除当前画布，回到初始状态
}

export function ImagePreview({
  currentImage,
  isGenerating,
  progress = 0,
  onUpload,
  onGalleryOpen,
  onExport,
  onClear
}: ImagePreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  if (!currentImage && !isGenerating) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-primary-50 transition-colors">
          <svg
            className="w-8 h-8 text-gray-300 group-hover:text-primary-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-400 text-sm mb-1">点击或拖拽上传参考图</p>
        <p className="text-gray-300 text-xs">JPG / PNG</p>

        {onGalleryOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGalleryOpen();
            }}
            className="mt-4 text-sm text-primary-500 hover:text-primary-600 transition-colors"
          >
            从图库选择
          </button>
        )}

        {/* 探索模式引导 */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-xs">
            或直接与右侧 Agent 对话，探索新设计方向
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {currentImage && (
        <img
          src={currentImage.url}
          alt="设计预览"
          className="w-full h-full object-contain"
          style={{ animation: 'scale-in 0.3s ease-out' }}
        />
      )}

      {isGenerating && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="relative w-12 h-12 mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-primary-200" />
            <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500 text-sm mb-2">生成中...</p>
          <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {currentImage && !isGenerating && (
        <div className="absolute top-3 right-3 flex gap-1.5">
          {/* 清除按钮 - 仅在v0时显示 */}
          {onClear && currentImage.id === 'v0' && (
            <button
              onClick={onClear}
              className="p-1.5 bg-white/80 backdrop-blur rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors group"
              title="清除画布"
            >
              <svg className="w-4 h-4 text-gray-500 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-white/80 backdrop-blur rounded-lg hover:bg-white transition-colors"
            title="更换"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="p-1.5 bg-white/80 backdrop-blur rounded-lg hover:bg-white transition-colors"
              title="导出"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
