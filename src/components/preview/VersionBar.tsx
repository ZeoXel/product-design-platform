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

/**
 * 版本号排序函数
 * v0 < v1.0 < v1.1 < v1.2 < v2.0 < v2.1 ...
 */
function sortVersions(versions: ImageVersion[]): ImageVersion[] {
  return [...versions].sort((a, b) => {
    // v0 特殊处理
    if (a.id === 'v0') return -1;
    if (b.id === 'v0') return 1;

    // 解析版本号 vX.Y
    const matchA = a.id.match(/^v(\d+)\.(\d+)$/);
    const matchB = b.id.match(/^v(\d+)\.(\d+)$/);

    if (!matchA && !matchB) return 0;
    if (!matchA) return 1;
    if (!matchB) return -1;

    const [, mainA, subA] = matchA;
    const [, mainB, subB] = matchB;

    // 先比较主版本号
    const mainDiff = parseInt(mainA) - parseInt(mainB);
    if (mainDiff !== 0) return mainDiff;

    // 再比较次版本号
    return parseInt(subA) - parseInt(subB);
  });
}

/**
 * 格式化版本号显示
 */
function formatVersionLabel(version: ImageVersion): string {
  if (version.id === 'v0') {
    return '原图';
  }
  // vX.Y -> X.Y
  const match = version.id.match(/^v(\d+\.\d+)$/);
  return match ? match[1] : version.id;
}

interface VersionBarProps {
  // 当前画布的版本管理
  versions: ImageVersion[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  // 生成状态
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
  onDelete,
  generationStep = 'idle',
  error,
  showRating = false,
  userRating,
  onRate
}: VersionBarProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const hasVersions = versions.length > 0;

  if (!hasVersions && generationStep === 'idle') {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {/* 左侧：版本选择 */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {hasVersions && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-gray-400 shrink-0">版本</span>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {sortVersions(versions).map((version) => (
                <div key={version.id} className="relative shrink-0 group/version">
                  <button
                    onClick={() => onSelect(version.id)}
                    className={`
                      relative w-9 h-9 rounded-lg overflow-hidden
                      border-2 transition-all duration-150
                      ${currentId === version.id
                        ? 'border-primary-500'
                        : 'border-transparent hover:border-gray-300'
                      }
                    `}
                    title={version.id}
                  >
                    <img
                      src={version.url}
                      alt={version.id}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center">
                      {formatVersionLabel(version)}
                    </span>
                  </button>
                  {/* 删除按钮 - hover 时显示（v0 不可删除） */}
                  {onDelete && version.id !== 'v0' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(version.id);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/version:opacity-100 transition-opacity"
                      title="删除此版本"
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 右侧：生成步骤或评价 */}
      <div className="flex items-center gap-2 shrink-0">
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
