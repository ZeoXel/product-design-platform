import { useState } from 'react';
import type { ImageVersion, GenerationStep } from '../../types';

const stepLabels: Record<GenerationStep, string> = {
  idle: '',
  analyzing: '分析需求',
  searching: '检索相似款',
  checking: '检查兼容性',
  generating: '生成图像',
  verifying: '质量验证',
  complete: '生成完成',
  error: '生成失败'
};

const ratings = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😊' },
];

interface VersionBarProps {
  versions: ImageVersion[];
  currentId: string | null;
  onSelect: (id: string) => void;
  generationStep?: GenerationStep;
  error?: string;
  showRating?: boolean;
  userRating?: number;
  onRate?: (rating: number) => void;
}

export function VersionBar({
  versions,
  currentId,
  onSelect,
  generationStep = 'idle',
  error,
  showRating = false,
  userRating,
  onRate
}: VersionBarProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  if (versions.length === 0 && generationStep === 'idle') {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      {/* 左侧：版本选择 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">版本</span>
        <div className="flex gap-1">
          {versions.map((version, index) => (
            <button
              key={version.id}
              onClick={() => onSelect(version.id)}
              className={`
                relative w-9 h-9 rounded-lg overflow-hidden
                border-2 transition-all duration-150
                ${currentId === version.id
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-gray-300'
                }
              `}
            >
              <img
                src={version.url}
                alt={`v${index + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center">
                {index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧：生成步骤或评价 */}
      <div className="flex items-center gap-2">
        {generationStep === 'complete' && showRating ? (
          // 评价
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">评价</span>
            {ratings.map((r) => (
              <button
                key={r.value}
                onClick={() => onRate?.(r.value)}
                onMouseEnter={() => setHoveredRating(r.value)}
                onMouseLeave={() => setHoveredRating(null)}
                className={`
                  text-base transition-transform
                  ${hoveredRating === r.value ? 'scale-125' : ''}
                  ${userRating === r.value ? 'scale-125' : 'opacity-60 hover:opacity-100'}
                `}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        ) : generationStep === 'complete' ? (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs">完成</span>
          </div>
        ) : generationStep === 'error' ? (
          <div className="flex items-center gap-1.5 text-rose-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs">{error || '失败'}</span>
          </div>
        ) : generationStep !== 'idle' && (
          <div className="flex items-center gap-1.5 text-primary-500">
            <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">{stepLabels[generationStep]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
