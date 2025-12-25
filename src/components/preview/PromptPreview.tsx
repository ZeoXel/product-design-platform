import { useState } from 'react';
import type { LayeredPrompt } from '../../types';

interface PromptLayer {
  key: keyof LayeredPrompt;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const PROMPT_LAYERS: PromptLayer[] = [
  {
    key: 'identity',
    label: '产品身份',
    labelEn: 'IDENTITY',
    icon: '1',
    color: 'red',
    priority: 'critical',
  },
  {
    key: 'structure',
    label: '结构约束',
    labelEn: 'STRUCTURE',
    icon: '2',
    color: 'orange',
    priority: 'high',
  },
  {
    key: 'materials',
    label: '材质描述',
    labelEn: 'MATERIALS',
    icon: '3',
    color: 'yellow',
    priority: 'medium',
  },
  {
    key: 'style',
    label: '风格定义',
    labelEn: 'STYLE',
    icon: '4',
    color: 'green',
    priority: 'medium',
  },
  {
    key: 'modification',
    label: '用户修改',
    labelEn: 'MODIFICATION',
    icon: '5',
    color: 'blue',
    priority: 'critical',
  },
  {
    key: 'technical',
    label: '技术参数',
    labelEn: 'TECHNICAL',
    icon: '6',
    color: 'purple',
    priority: 'low',
  },
  {
    key: 'negative',
    label: '负面词',
    labelEn: 'NEGATIVE',
    icon: '⛔',
    color: 'gray',
    priority: 'high',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-600',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-600',
  },
};

interface PromptPreviewProps {
  layeredPrompt: LayeredPrompt | null;
  showFullPrompt?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function PromptPreview({
  layeredPrompt,
  showFullPrompt = false,
  collapsible = true,
  defaultExpanded = false,
}: PromptPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  if (!layeredPrompt) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
        暂无 Prompt 信息
      </div>
    );
  }

  const toggleLayer = (key: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedLayers(newExpanded);
  };

  const renderLayerContent = (layer: PromptLayer) => {
    const content = layeredPrompt[layer.key];
    if (!content || (typeof content === 'string' && content.trim() === '')) {
      return <span className="text-gray-400 italic">（空）</span>;
    }

    const colors = colorClasses[layer.color];
    const isLayerExpanded = expandedLayers.has(layer.key);
    const shouldTruncate = typeof content === 'string' && content.length > 100 && !isLayerExpanded;

    return (
      <div className="text-xs text-gray-600 leading-relaxed">
        {shouldTruncate ? (
          <>
            {content.slice(0, 100)}...
            <button
              onClick={() => toggleLayer(layer.key)}
              className={`ml-1 ${colors.text} hover:underline`}
            >
              展开
            </button>
          </>
        ) : (
          <>
            {content}
            {typeof content === 'string' && content.length > 100 && (
              <button
                onClick={() => toggleLayer(layer.key)}
                className={`ml-1 ${colors.text} hover:underline`}
              >
                收起
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200
          ${collapsible ? 'cursor-pointer hover:bg-gray-100' : ''}
        `}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <span className="text-sm font-medium text-gray-700">分层 Prompt 结构</span>
          <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
            6 层
          </span>
        </div>
        {collapsible && (
          <button className="text-gray-400 hover:text-gray-600">
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {(isExpanded || !collapsible) && (
        <div className="p-4 space-y-3">
          {/* 预设信息 */}
          <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">产品类型:</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                {layeredPrompt.product_type}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">风格:</span>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full font-medium">
                {layeredPrompt.style_key}
              </span>
            </div>
          </div>

          {/* 分层展示 */}
          {PROMPT_LAYERS.map((layer) => {
            const colors = colorClasses[layer.color];
            const content = layeredPrompt[layer.key];
            const isEmpty = !content || (typeof content === 'string' && content.trim() === '');

            if (isEmpty && layer.key === 'negative') {
              return null; // 负面词为空时不显示
            }

            return (
              <div
                key={layer.key}
                className={`
                  p-3 rounded-lg border
                  ${colors.bg} ${colors.border}
                  ${layer.priority === 'critical' ? 'ring-1 ring-offset-1 ring-red-200' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${colors.badge}
                    `}
                  >
                    {layer.icon}
                  </span>
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {layer.label}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase">
                    {layer.labelEn}
                  </span>
                  {layer.priority === 'critical' && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded">
                      关键
                    </span>
                  )}
                </div>
                {renderLayerContent(layer)}
              </div>
            );
          })}

          {/* 完整 Prompt */}
          {showFullPrompt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📝</span>
                <span className="text-sm font-medium text-gray-700">完整 Prompt</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {layeredPrompt.full_prompt}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PromptPreview;
