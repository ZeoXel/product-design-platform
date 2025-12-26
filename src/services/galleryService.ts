/**
 * 图库服务 - 前端静态数据
 */

import galleryData from '../data/galleryMetadata.json';

// ==================== 类型定义 ====================

export interface ElementInfo {
  type: string;
  color: string | null;
  count: number | null;
  material: string | null;
  position: string | null;
}

export interface GalleryItemAnalysis {
  elements: {
    primary: ElementInfo[];
    secondary: ElementInfo[];
    hardware: ElementInfo[];
  };
  style: {
    tags: string[];
    mood: string;
  };
  physicalSpecs: {
    lengthCm: number;
    weightG: number;
  };
  suggestions: string[];
  similarItems: string[] | null;
}

export interface GalleryItem {
  id: string;
  filename: string;
  uploadTime: string;
  analysis: GalleryItemAnalysis;
  salesTier: string;
}

// ==================== 数据访问 ====================

const galleryItems = galleryData.items as GalleryItem[];

/**
 * 获取图库图片 URL
 */
export function getGalleryImageUrl(filename: string): string {
  return `/gallery/${filename}`;
}

/**
 * 获取所有图库项目
 */
export function getGalleryItems(): GalleryItem[] {
  return galleryItems;
}

/**
 * 获取单个图库项目
 */
export function getGalleryItem(id: string): GalleryItem | undefined {
  return galleryItems.find(item => item.id === id);
}

/**
 * 按风格标签搜索
 */
export function searchByStyleTags(tags: string[]): GalleryItem[] {
  if (tags.length === 0) return galleryItems;

  return galleryItems.filter(item => {
    const itemTags = item.analysis.style.tags.map(t => t.toLowerCase());
    return tags.some(tag =>
      itemTags.some(itemTag => itemTag.includes(tag.toLowerCase()))
    );
  });
}

/**
 * 按销售等级筛选
 */
export function filterBySalesTier(tier: string): GalleryItem[] {
  return galleryItems.filter(item => item.salesTier === tier);
}

/**
 * 获取所有风格标签
 */
export function getAllStyleTags(): string[] {
  const tagsSet = new Set<string>();
  galleryItems.forEach(item => {
    item.analysis.style.tags.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}

/**
 * 随机获取图库项目（用于参考图推荐）
 */
export function getRandomItems(count: number): GalleryItem[] {
  const shuffled = [...galleryItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 按元素类型搜索
 */
export function searchByElementType(elementType: string): GalleryItem[] {
  const lowerType = elementType.toLowerCase();

  return galleryItems.filter(item => {
    const allElements = [
      ...item.analysis.elements.primary,
      ...item.analysis.elements.secondary,
      ...item.analysis.elements.hardware,
    ];

    return allElements.some(el =>
      el.type.toLowerCase().includes(lowerType)
    );
  });
}

/**
 * 图库统计信息
 */
export function getGalleryStats(): {
  total: number;
  byTier: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
} {
  const byTier: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  galleryItems.forEach(item => {
    byTier[item.salesTier] = (byTier[item.salesTier] || 0) + 1;
    item.analysis.style.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: galleryItems.length,
    byTier,
    topTags,
  };
}
