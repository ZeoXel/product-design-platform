import React from 'react';
import type { CostBreakdown } from '../../types';

interface CostPanelProps {
  breakdown: CostBreakdown | null;
  isEstimating?: boolean;
}

export function CostPanel({ breakdown, isEstimating = false }: CostPanelProps) {
  if (!breakdown && !isEstimating) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide">预估成本</p>
        <p className="text-2xl font-semibold text-gray-300 mt-1">--</p>
      </div>
    );
  }

  if (isEstimating) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">预估成本</p>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">预估成本</p>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-semibold text-gray-900">
          ¥{breakdown!.totalCost.toFixed(2)}
        </span>
        <span className="text-xs text-gray-400">/件</span>
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-200">
        {breakdown!.materials.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-500">{item.name}</span>
            <span className="text-gray-700 font-mono">¥{item.total.toFixed(2)}</span>
          </div>
        ))}

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">人工费用</span>
          <span className="text-gray-700 font-mono">¥{breakdown!.labor.total.toFixed(2)}</span>
        </div>

        {breakdown!.apiCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">AI 生成费</span>
            <span className="text-gray-700 font-mono">¥{breakdown!.apiCost.toFixed(2)}</span>
          </div>
        )}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
        查看详细报价单
      </button>
    </div>
  );
}
