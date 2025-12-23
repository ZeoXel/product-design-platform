import React from 'react';

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
}

export function ImageAnalysisPanel({
  analysis,
  isAnalyzing,
  similarItems = [],
  onSimilarClick
}: ImageAnalysisPanelProps) {
  if (!analysis && !isAnalyzing) {
    return null;
  }

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">分析中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 元素识别 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">元素</p>
        <div className="flex flex-wrap gap-1.5">
          {analysis?.elements.primary.map((el, i) => (
            <span
              key={`p-${i}`}
              className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full"
            >
              {el.type}{el.color && ` · ${el.color}`}
            </span>
          ))}
          {analysis?.elements.secondary.map((el, i) => (
            <span
              key={`s-${i}`}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {el.type}{el.count && ` ×${el.count}`}
            </span>
          ))}
          {analysis?.elements.hardware.map((el, i) => (
            <span
              key={`h-${i}`}
              className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full"
            >
              {el.type}
            </span>
          ))}
        </div>
      </div>

      {/* 风格 */}
      <div>
        <p className="text-xs text-gray-400 mb-1">风格</p>
        <p className="text-sm text-gray-600">
          {analysis?.style.tags.join(' · ')}
        </p>
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
