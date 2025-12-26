import { useMemo } from 'react';
import { detectStyleFromTags, getStyleInfo, type StyleKey } from '../style/StyleSelector';

export interface ImageAnalysis {
  elements: {
    primary: { type: string; color?: string }[];
    secondary: { type: string; count?: number }[];
    hardware: { type: string; material?: string }[];
  };
  style: {
    tags: string[];
    mood: string;
  };
  physicalSpecs: {
    lengthCm: number;
    weightG: number;
  };
  suggestions: string[];
}

interface ImageAnalysisPanelProps {
  analysis: ImageAnalysis | null;
  isAnalyzing: boolean;
  similarItems?: { id: string; url: string; similarity: number }[];
  onSimilarClick?: (id: string) => void;
  onStyleSelect?: (style: StyleKey) => void;
  versionId?: string;  // 当前版本ID，用于显示版本标识
}

export function ImageAnalysisPanel({
  analysis,
  isAnalyzing,
  similarItems = [],
  onSimilarClick,
  onStyleSelect,
  versionId
}: ImageAnalysisPanelProps) {
  // 检测风格类型
  const detectedStyle = useMemo(() => {
    if (!analysis?.style.tags) return null;
    return detectStyleFromTags(analysis.style.tags);
  }, [analysis?.style.tags]);

  const styleInfo = detectedStyle ? getStyleInfo(detectedStyle) : null;

  if (!analysis && !isAnalyzing) {
    return null;
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">AI 分析中...</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 版本指示器 */}
      {versionId && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">分析结果</span>
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-mono">
            {versionId.toUpperCase()}
          </span>
        </div>
      )}

      {/* 风格识别卡片 - 基于实际分析结果 */}
      {analysis?.style && (
        <div
          className="p-3 rounded-xl bg-gradient-to-br from-violet-50 via-primary-50 to-rose-50 border border-violet-200/50 cursor-pointer hover:shadow-md transition-all"
          onClick={() => detectedStyle && onStyleSelect?.(detectedStyle)}
        >
          {/* 顶部：风格匹配 + 氛围 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {styleInfo ? (
                <>
                  <span className="text-xl">{styleInfo.emoji}</span>
                  <span className="text-sm font-semibold text-gray-700">{styleInfo.name}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span className="text-sm font-semibold text-gray-700">风格分析</span>
                </>
              )}
            </div>
            {analysis.style.mood && (
              <span className="px-2 py-0.5 bg-white/70 text-violet-600 text-[10px] rounded-full font-medium">
                {analysis.style.mood}
              </span>
            )}
          </div>

          {/* 风格标签云 */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {analysis.style.tags.slice(0, 5).map((tag, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${
                  i === 0
                    ? 'bg-violet-500 text-white'
                    : i === 1
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-white/80 text-gray-600'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 底部：预设风格推荐色 */}
          {styleInfo && (
            <div className="flex items-center gap-1 pt-2 border-t border-violet-100">
              <span className="text-[10px] text-gray-400">推荐配色</span>
              {styleInfo.colors.slice(0, 4).map((color, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-white/60 text-gray-500 text-[10px] rounded"
                >
                  {color}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 元素识别 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">识别元素</p>
          <span className="text-[10px] text-gray-300">
            共 {(analysis?.elements.primary.length || 0) + (analysis?.elements.secondary.length || 0) + (analysis?.elements.hardware.length || 0)} 个
          </span>
        </div>

        {/* 主元素 */}
        {(analysis?.elements?.primary?.length || 0) > 0 && analysis && (
          <div className="mb-2">
            <p className="text-[10px] text-gray-300 mb-1">主体</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.elements.primary.map((el, i) => (
                <span
                  key={`p-${i}`}
                  className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium"
                >
                  {el.type}{el.color && ` · ${el.color}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 辅助元素 */}
        {(analysis?.elements?.secondary?.length || 0) > 0 && analysis && (
          <div className="mb-2">
            <p className="text-[10px] text-gray-300 mb-1">辅助</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.elements.secondary.map((el, i) => (
                <span
                  key={`s-${i}`}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {el.type}{el.count && ` ×${el.count}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 五金配件 */}
        {(analysis?.elements?.hardware?.length || 0) > 0 && analysis && (
          <div>
            <p className="text-[10px] text-gray-300 mb-1">五金</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.elements.hardware.map((el, i) => (
                <span
                  key={`h-${i}`}
                  className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full"
                >
                  {el.type}{el.material && ` · ${el.material}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 规格 */}
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-gray-400">长度 </span>
          <span className="text-gray-600">{analysis?.physicalSpecs.lengthCm}cm</span>
        </div>
        <div>
          <span className="text-gray-400">重量 </span>
          <span className="text-gray-600">~{analysis?.physicalSpecs.weightG}g</span>
        </div>
      </div>

      {/* 建议 */}
      {analysis?.suggestions && analysis.suggestions.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">建议</p>
          <div className="space-y-1">
            {analysis.suggestions.map((s, i) => (
              <p key={i} className="text-xs text-gray-500 leading-relaxed">• {s}</p>
            ))}
          </div>
        </div>
      )}

      {/* 相似 */}
      {similarItems.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">相似</p>
          <div className="flex gap-2">
            {similarItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => onSimilarClick?.(item.id)}
                className="relative group"
              >
                <img
                  src={item.url}
                  alt=""
                  className="w-11 h-11 rounded-lg object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <span className="absolute bottom-0 right-0 px-1 bg-black/50 text-white text-[9px] rounded-tl rounded-br-lg">
                  {Math.round(item.similarity * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
