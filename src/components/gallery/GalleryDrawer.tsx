import React, { useState, useEffect } from 'react';
import type { ReferenceProduct } from '../../types';
import { api } from '../../services/api';

const categories = ['全部', '海洋', '极简', '复古', '现代'];

interface GalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: ReferenceProduct) => void;
}

export function GalleryDrawer({ isOpen, onClose, onSelect }: GalleryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [products, setProducts] = useState<ReferenceProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载图库数据
  useEffect(() => {
    const loadGallery = async () => {
      try {
        setLoading(true);
        const response = await api.listReferences({ limit: 100 });

        // 转换 GalleryReference 到 ReferenceProduct 格式
        const transformedProducts: ReferenceProduct[] = response.items.map(item => ({
          id: item.id,
          imageUrl: `/gallery/images/${item.filename}`,
          elements: [
            ...item.analysis.elements.primary.map(e => e.type),
            ...item.analysis.elements.secondary.map(e => e.type),
          ],
          style: item.analysis.style.tags[0] || '未分类',
          salesTier: (item as any).salesTier || 'B',
        }));

        setProducts(transformedProducts);
      } catch (error) {
        console.error('加载图库失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadGallery();
    }
  }, [isOpen]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.elements.some(el => el.includes(searchQuery)) ||
      product.style.includes(searchQuery);
    const matchesCategory = activeCategory === '全部' || product.style === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`
          fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 w-[380px] glass z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-medium text-gray-700">选择参考图</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="px-5 pb-4 space-y-3">
          {/* 搜索框 */}
          <div className="relative">
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
              placeholder="搜索风格、元素..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 rounded-xl placeholder-gray-400 text-gray-700"
            />
          </div>

          {/* 分类标签 */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-all
                  ${activeCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/60 text-gray-500 hover:bg-white'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 图片网格 */}
        <div className="flex-1 overflow-y-auto px-5 pb-20">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">未找到匹配的参考图</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product);
                    onClose();
                  }}
                  className="group relative aspect-square rounded-xl overflow-hidden"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.style}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* 销量标签 */}
                  {product.salesTier === 'A' && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] rounded-md">
                      热销
                    </span>
                  )}
                  {/* 悬浮遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-2 py-1 bg-white/90 rounded-lg text-xs font-medium text-gray-700">
                      使用
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="absolute bottom-4 left-5 right-5">
          <div className="glass-subtle rounded-xl px-4 h-12 flex items-center justify-between">
            <span className="text-xs text-gray-400">共 {filteredProducts.length} 个参考图</span>
            <button className="text-xs text-primary-500 hover:text-primary-600">
              查看完整图库
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
