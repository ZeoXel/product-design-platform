import React, { useState } from 'react';

interface HistoryItem {
  id: string;
  timestamp: Date;
  instruction: string;
  referenceUrl: string;
  generatedUrl: string;
  versionsCount: number;
  status: 'success' | 'failed';
  cost: number;
}

// 模拟数据
const mockHistory: HistoryItem[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    instruction: '把粉色贝壳换成蓝色水晶',
    referenceUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop',
    generatedUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop',
    versionsCount: 3,
    status: 'success',
    cost: 0.45,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    instruction: '增加星星装饰元素',
    referenceUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop',
    generatedUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=200&h=200&fit=crop',
    versionsCount: 5,
    status: 'success',
    cost: 0.75,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    instruction: '改成运动风格手链',
    referenceUrl: 'https://images.unsplash.com/photo-1625314897518-bb4fe6e95229?w=200&h=200&fit=crop',
    generatedUrl: 'https://images.unsplash.com/photo-1625314897518-bb4fe6e95229?w=200&h=200&fit=crop',
    versionsCount: 2,
    status: 'success',
    cost: 0.30,
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    instruction: '颜色改成渐变紫色',
    referenceUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop',
    generatedUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=200&h=200&fit=crop',
    versionsCount: 4,
    status: 'success',
    cost: 0.60,
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    instruction: '添加珍珠元素',
    referenceUrl: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=200&h=200&fit=crop',
    generatedUrl: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=200&h=200&fit=crop',
    versionsCount: 3,
    status: 'success',
    cost: 0.45,
  },
];

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export function History() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemDate.getTime() === today.getTime()) return '今天';
    if (itemDate.getTime() === yesterday.getTime()) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  // 按日期分组
  const groupedHistory = mockHistory.reduce((groups, item) => {
    const dateKey = formatDate(item.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  // 统计数据
  const stats = {
    total: mockHistory.length,
    success: mockHistory.filter(h => h.status === 'success').length,
    totalCost: mockHistory.reduce((sum, h) => sum + h.cost, 0),
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* 左侧筛选 */}
      <div className="w-60 bg-white border-r border-gray-200 p-4 flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">设计历史</h2>

        {/* 时间筛选 */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">时间范围</p>
          <div className="space-y-1">
            {[
              { id: 'today' as const, label: '今天' },
              { id: 'week' as const, label: '本周' },
              { id: 'month' as const, label: '本月' },
              { id: 'all' as const, label: '全部' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setTimeFilter(option.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${timeFilter === option.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 统计面板 */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">统计</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">生成次数</span>
              <span className="text-gray-700 font-medium">{stats.total} 次</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">成功率</span>
              <span className="text-green-600 font-medium">
                {Math.round((stats.success / stats.total) * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">累计成本</span>
              <span className="text-gray-700 font-medium font-mono">¥{stats.totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧列表 */}
      <div className="flex-1 flex flex-col">
        {/* 搜索栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索历史记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* 历史列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                {date}
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                  >
                    <div className="flex gap-4">
                      {/* 缩略图 */}
                      <div className="flex gap-2 shrink-0">
                        <img
                          src={item.referenceUrl}
                          alt="参考图"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex items-center text-gray-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                        <img
                          src={item.generatedUrl}
                          alt="生成图"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          "{item.instruction}"
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span>{formatTime(item.timestamp)}</span>
                          <span>·</span>
                          <span>{item.versionsCount} 个版本</span>
                          <span>·</span>
                          <span className="font-mono">¥{item.cost.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                          查看
                        </button>
                        <button className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
                          再次编辑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {mockHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">暂无设计历史</p>
              <p className="text-gray-400 text-sm mt-1">开始创建你的第一个设计吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
