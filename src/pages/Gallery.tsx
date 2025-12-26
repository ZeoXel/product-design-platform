import { useState, useEffect } from 'react';
import type { ReferenceProduct } from '../types';
import { api, getGalleryImageUrl } from '../services/api';

// 将后端数据转换为前端格式
function transformGalleryItem(item: any): ReferenceProduct {
  const primaryElements = item.analysis?.elements?.primary?.map((e: any) => e.type) || [];
  const secondaryElements = item.analysis?.elements?.secondary?.map((e: any) => e.type) || [];
  const styleTags = item.analysis?.style?.tags || [];

  return {
    id: item.id,
    imageUrl: getGalleryImageUrl(item.filename),
    elements: [...primaryElements, ...secondaryElements],
    style: styleTags[0] || '未分类',
    salesTier: item.salesTier || 'B'
  };
}

const categories = ['全部', '珠宝', '运动', '海洋', '极简', '复古', '民族'];

interface GalleryProps {
  onSelect?: (product: ReferenceProduct) => void;
}

export function Gallery({ onSelect }: GalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<ReferenceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载图库数据
  useEffect(() => {
    const loadGallery = async () => {
      try {
        setLoading(true);
        const response = await api.listReferences({ limit: 100 });

        if (response.success && response.items) {
          const transformed = response.items.map(transformGalleryItem);
          setProducts(transformed);
        }
      } catch (error) {
        console.error('加载图库失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.elements.some(el => el.includes(searchQuery)) ||
      product.style.includes(searchQuery);
    const matchesCategory = activeCategory === '全部' ||
      product.style === activeCategory ||
      product.elements.some(el => el.includes(activeCategory));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 搜索和筛选 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
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
              placeholder="搜索挂饰风格、元素..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* 分类标签 */}
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  px-4 py-1.5 text-sm rounded-full transition-colors
                  ${activeCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 图库网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300"
              onClick={() => onSelect?.(product)}
            >
              {/* 图片 */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={product.imageUrl}
                  alt={product.style}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* 销量标签 */}
              {product.salesTier === 'A' && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                  热销
                </div>
              )}

              {/* 收藏按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className={`
                  absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${favorites.has(product.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500'
                  }
                `}
              >
                <svg className="w-4 h-4" fill={favorites.has(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* 信息 */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-700">{product.style}风格</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {product.elements.join(' · ')}
                </p>
              </div>

              {/* 悬浮操作 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-lg hover:bg-gray-50 transition-colors">
                  使用此参考图
                </button>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500">未找到匹配的参考图</p>
              <p className="text-gray-400 text-sm mt-1">试试其他关键词或分类</p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between text-sm text-gray-500">
        <span>共 {filteredProducts.length} 个参考图</span>
        <span>已收藏 {favorites.size} 个</span>
      </div>
    </div>
  );
}
