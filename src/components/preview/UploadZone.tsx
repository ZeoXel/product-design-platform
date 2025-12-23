import React, { useCallback, useState } from 'react';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export function UploadZone({
  onUpload,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.size <= maxSize) {
      onUpload(file);
    }
  }, [onUpload, maxSize]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= maxSize) {
      onUpload(file);
    }
  }, [onUpload, maxSize]);

  return (
    <label
      className={`
        flex flex-col items-center justify-center
        w-full p-6 cursor-pointer
        border-2 border-dashed rounded-xl
        transition-all duration-200 ease-out
        ${isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
      />

      <svg
        className={`w-10 h-10 mb-3 transition-colors ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
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

      <p className="text-sm text-gray-500">
        <span className="text-primary-600 font-medium">点击上传</span>
        {' '}或拖拽图片到这里
      </p>
      <p className="text-xs text-gray-400 mt-1">
        支持 JPG、PNG，最大 10MB
      </p>
    </label>
  );
}
