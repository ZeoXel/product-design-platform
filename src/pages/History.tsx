import React, { useState, useEffect } from 'react';
import {
  filterHistoryByTime,
  searchHistory,
  deleteHistoryItem,
  getHistoryStats,
  type HistoryItem
} from '../services/historyService';

interface HistoryProps {
  onNavigate?: (page: 'workspace' | 'gallery' | 'history') => void;
  onEdit?: (item: HistoryItem) => void;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export function History({ onNavigate, onEdit }: HistoryProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, totalCost: 0 });

  // 加载历史记录
  useEffect(() => {
    loadHistory();
  }, [timeFilter, searchQuery]);

  const loadHistory = () => {
    let items: HistoryItem[];
    if (searchQuery.trim()) {
      items = searchHistory(searchQuery);
    } else {
      items = filterHistoryByTime(timeFilter);
    }
    setHistoryItems(items);
    setStats(getHistoryStats());
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const dateObj = new Date(date);
    const diff = now.getTime() - dateObj.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return dateObj.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const dateObj = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const itemDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    if (itemDate.getTime() === today.getTime()) return '今天';
    if (itemDate.getTime() === yesterday.getTime()) return '昨天';
    return dateObj.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  // 按日期分组
  const groupedHistory = historyItems.reduce((groups, item) => {
    const dateKey = formatDate(item.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  const handleEdit = (item: HistoryItem) => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条历史记录吗？')) {
      deleteHistoryItem(id);
      loadHistory();
    }
  };

  const handleView = (item: HistoryItem) => {
    // 打开查看模态框或直接编辑
    handleEdit(item);
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

        {/* 快速操作 */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">快速操作</p>
          <button
            onClick={() => onNavigate?.('workspace')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建设计
          </button>
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
                {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
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
          {Object.keys(groupedHistory).length > 0 ? (
            Object.entries(groupedHistory).map(([date, items]) => (
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
                      onClick={() => handleView(item)}
                    >
                      <div className="flex gap-4">
                        {/* 缩略图 */}
                        <div className="flex gap-2 shrink-0">
                          {item.referenceUrl ? (
                            <img
                              src={item.referenceUrl}
                              alt="参考图"
                              className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex items-center text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                          {item.generatedUrl ? (
                            <img
                              src={item.generatedUrl}
                              alt="生成图"
                              className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
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
                            {item.status === 'failed' && (
                              <>
                                <span>·</span>
                                <span className="text-red-500">失败</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            再次编辑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">暂无设计历史</p>
              <p className="text-gray-400 text-sm mt-1">开始创建你的第一个设计吧</p>
              <button
                onClick={() => onNavigate?.('workspace')}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                开始设计
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
