/**
 * 画布抽屉 - 左侧悬浮显示历史画布
 * 复刻 GalleryDrawer 的 UI 风格，鼠标悬停左侧边缘呼出
 */

import { useState, useEffect, useCallback } from 'react';
import type { DesignCanvas } from '../../types';

interface CanvasDrawerProps {
  canvases: DesignCanvas[];
  currentCanvasId: string | null;
  onSelectCanvas: (canvas: DesignCanvas) => void;
  onCreateCanvas: () => void;
  onDeleteCanvas?: (id: string) => void;
}

export function CanvasDrawer({
  canvases,
  currentCanvasId,
  onSelectCanvas,
  onCreateCanvas,
  onDeleteCanvas,
}: CanvasDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // 延迟关闭，避免快速移动时闪烁
  useEffect(() => {
    if (!isHovering) {
      const timer = setTimeout(() => setIsOpen(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isHovering]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* 左侧触发区域 - 始终存在 */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 w-4 h-40 z-40 cursor-pointer"
        onMouseEnter={handleMouseEnter}
      >
        {/* 触发指示器 */}
        <div className={`
          absolute left-0 top-1/2 -translate-y-1/2
          w-1.5 h-20 rounded-r-full transition-all duration-300
          ${isOpen
            ? 'bg-primary-400 w-2 shadow-lg shadow-primary-400/30'
            : 'bg-gray-300 hover:bg-gray-400 hover:w-2'
          }
        `} />
      </div>

      {/* 背景遮罩 */}
      <div
        className={`
          fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* 抽屉面板 */}
      <div
        className={`
          fixed left-0 top-0 bottom-0 w-[320px] glass z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-medium text-gray-700">历史画布</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{canvases.length} 个</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 新建画布按钮 */}
        <div className="px-5 pb-4">
          <button
            onClick={() => {
              onCreateCanvas();
              setIsOpen(false);
            }}
            className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建画布
          </button>
        </div>

        {/* 画布网格 */}
        <div className="flex-1 overflow-y-auto px-5 pb-20">
          {canvases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm">暂无历史画布</p>
              <p className="text-xs text-gray-300 mt-1">点击上方按钮创建</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {canvases.map((canvas) => {
                const isActive = canvas.id === currentCanvasId;
                const latestVersion = canvas.versions[canvas.versions.length - 1];
                const thumbnailUrl = canvas.thumbnail || latestVersion?.url;
                const hasContent = canvas.versions.length > 0;

                return (
                  <button
                    key={canvas.id}
                    onClick={() => {
                      onSelectCanvas(canvas);
                      setIsOpen(false);
                    }}
                    className={`
                      group relative aspect-[4/3] rounded-xl overflow-hidden
                      transition-all duration-200
                      ${isActive
                        ? 'ring-2 ring-primary-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                      }
                    `}
                  >
                    {/* 缩略图或占位 */}
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={canvas.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* 当前标记 */}
                    {isActive && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary-500 text-white text-[10px] rounded-md font-medium">
                        当前
                      </span>
                    )}

                    {/* 版本数量标记 */}
                    {hasContent && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded-md">
                        {canvas.versions.length} 版
                      </span>
                    )}

                    {/* 底部信息栏 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                      <p className="text-white text-xs font-medium truncate">{canvas.name}</p>
                      <p className="text-white/60 text-[10px] mt-0.5">{formatTime(canvas.updatedAt)}</p>
                    </div>

                    {/* 悬浮遮罩 - 删除按钮 */}
                    {onDeleteCanvas && !isActive && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCanvas(canvas.id);
                          }}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                          title="删除画布"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="absolute bottom-4 left-5 right-5">
          <div className="glass-subtle rounded-xl px-4 h-12 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {canvases.reduce((sum, c) => sum + c.versions.length, 0)} 个版本
            </span>
            <span className="text-xs text-gray-300">
              鼠标移开自动收起
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
