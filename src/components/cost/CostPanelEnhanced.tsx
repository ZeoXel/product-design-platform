import React, { useState } from 'react';

export interface CostBreakdown {
  materials: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  labor: {
    timeMinutes: number;
    hourlyRate: number;
    total: number;
  };
  apiCost: number;
  totalCost: number;
  currency: string;
}

interface CostPanelEnhancedProps {
  breakdown: CostBreakdown | null;
  isEstimating?: boolean;
}

export function CostPanelEnhanced({ breakdown, isEstimating = false }: CostPanelEnhancedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!breakdown && !isEstimating) {
    return (
      <div className="w-full flex items-center justify-between">
        <span className="text-sm text-gray-400">预估成本</span>
        <span className="text-lg font-semibold text-gray-300">--</span>
      </div>
    );
  }

  if (isEstimating) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">估算中...</span>
      </div>
    );
  }

  const materialTotal = breakdown!.materials.reduce((sum, m) => sum + m.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">预估成本</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary-500 hover:text-primary-600"
          >
            {isExpanded ? '收起' : '明细'}
          </button>
        </div>
        <span className="text-lg font-semibold text-gray-800">
          ¥{breakdown!.totalCost.toFixed(2)}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>材料</span>
            <span>¥{materialTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>人工 ({breakdown!.labor.timeMinutes}min)</span>
            <span>¥{breakdown!.labor.total.toFixed(2)}</span>
          </div>
          {breakdown!.apiCost > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>AI生成</span>
              <span>¥{breakdown!.apiCost.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
