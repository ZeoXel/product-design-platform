import React from 'react';

export type GenerationStep =
  | 'idle'
  | 'analyzing'
  | 'searching'
  | 'checking'
  | 'generating'
  | 'verifying'
  | 'complete'
  | 'error';

interface GenerationStepsProps {
  currentStep: GenerationStep;
  error?: string;
}

const steps = [
  { id: 'analyzing', label: '分析参考图', icon: '🔍' },
  { id: 'searching', label: '检索相似款', icon: '📚' },
  { id: 'checking', label: '检查兼容性', icon: '✓' },
  { id: 'generating', label: '生成图像', icon: '🎨' },
  { id: 'verifying', label: '质量验证', icon: '✅' },
];

export function GenerationSteps({ currentStep, error }: GenerationStepsProps) {
  if (currentStep === 'idle') {
    return null;
  }

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const isComplete = currentStep === 'complete';
  const isError = currentStep === 'error';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-between mb-3">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = isComplete || currentIndex > index;
          const isFuture = !isComplete && currentIndex < index;

          return (
            <React.Fragment key={step.id}>
              {/* 步骤点 */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    transition-all duration-300
                    ${isActive ? 'bg-primary-500 text-white ring-4 ring-primary-100' : ''}
                    ${isPast ? 'bg-green-500 text-white' : ''}
                    ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                    ${isError && isActive ? 'bg-red-500 text-white ring-4 ring-red-100' : ''}
                  `}
                >
                  {isPast && !isActive ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    text-[10px] mt-1.5 whitespace-nowrap
                    ${isActive ? 'text-primary-600 font-medium' : ''}
                    ${isPast ? 'text-green-600' : ''}
                    ${isFuture ? 'text-gray-400' : ''}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 mt-[-12px] transition-colors duration-300
                    ${currentIndex > index || isComplete ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 当前状态文字 */}
      <div className="text-center">
        {isComplete ? (
          <p className="text-sm text-green-600 font-medium">生成完成</p>
        ) : isError ? (
          <p className="text-sm text-red-600">{error || '生成失败，请重试'}</p>
        ) : (
          <p className="text-sm text-gray-500">
            {steps.find(s => s.id === currentStep)?.label}中...
          </p>
        )}
      </div>
    </div>
  );
}
