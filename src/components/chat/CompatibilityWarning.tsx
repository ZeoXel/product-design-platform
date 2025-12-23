import React from 'react';

export interface CompatibilityCheck {
  compatible: boolean;
  score: number; // 0-100 成功率
  targetElement: string;
  existingElements: string[];
  warnings?: string[];
  alternatives?: {
    element: string;
    score: number;
  }[];
}

interface CompatibilityWarningProps {
  check: CompatibilityCheck;
  onContinue: () => void;
  onCancel: () => void;
  onSelectAlternative?: (element: string) => void;
}

export function CompatibilityWarning({
  check,
  onContinue,
  onCancel,
  onSelectAlternative
}: CompatibilityWarningProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
      {/* 标题 */}
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-yellow-800">兼容性提示</p>
          <p className="text-sm text-yellow-700 mt-0.5">
            「{check.targetElement}」与现有元素的组合
            {check.score >= 80 ? '比较常见' : check.score >= 60 ? '较少见' : '很少见'}
          </p>
        </div>
      </div>

      {/* 成功率 */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-yellow-700">预估成功率:</span>
        <span className={`px-2 py-0.5 rounded text-sm font-medium ${getScoreBg(check.score)} ${getScoreColor(check.score)}`}>
          {check.score}%
        </span>
      </div>

      {/* 警告信息 */}
      {check.warnings && check.warnings.length > 0 && (
        <ul className="space-y-1">
          {check.warnings.map((warning, i) => (
            <li key={i} className="text-xs text-yellow-700 flex items-start gap-1.5">
              <span className="text-yellow-500 mt-0.5">•</span>
              {warning}
            </li>
          ))}
        </ul>
      )}

      {/* 推荐替代 */}
      {check.alternatives && check.alternatives.length > 0 && (
        <div>
          <p className="text-xs text-yellow-700 mb-2">推荐替代:</p>
          <div className="flex flex-wrap gap-2">
            {check.alternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => onSelectAlternative?.(alt.element)}
                className="px-3 py-1.5 bg-white border border-yellow-300 rounded-lg text-sm text-yellow-800 hover:bg-yellow-100 transition-colors flex items-center gap-2"
              >
                <span>{alt.element}</span>
                <span className={`text-xs ${getScoreColor(alt.score)}`}>
                  {alt.score}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onContinue}
          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          继续生成
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 text-sm rounded-lg hover:bg-yellow-50 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
